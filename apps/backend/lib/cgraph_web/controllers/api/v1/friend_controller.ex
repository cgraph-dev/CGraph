defmodule CgraphWeb.API.V1.FriendController do
  @moduledoc """
  Handles friend relationships.
  Supports sending/accepting requests, listing friends, blocking users.
  """
  use CgraphWeb, :controller

  alias Cgraph.Accounts

  action_fallback CgraphWeb.FallbackController

  @doc """
  List user's friends.
  GET /api/v1/friends
  """
  def index(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "50") |> String.to_integer() |> min(100)
    status = Map.get(params, "status", "accepted") # accepted, pending, blocked
    
    {friends, meta} = Accounts.list_friends(user,
      page: page,
      per_page: per_page,
      status: status
    )
    
    render(conn, :index, friends: friends, meta: meta)
  end

  @doc """
  Get pending friend requests (received).
  GET /api/v1/friends/requests
  """
  def requests(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(50)
    
    {requests, meta} = Accounts.list_friend_requests(user,
      page: page,
      per_page: per_page
    )
    
    render(conn, :requests, requests: requests, meta: meta)
  end

  @doc """
  Get sent friend requests (outgoing).
  GET /api/v1/friends/sent
  """
  def sent(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(50)
    
    {requests, meta} = Accounts.list_sent_friend_requests(user,
      page: page,
      per_page: per_page
    )
    
    render(conn, :sent, requests: requests, meta: meta)
  end

  @doc """
  Send a friend request.
  POST /api/v1/friends
  """
  def create(conn, %{"user_id" => target_user_id}) do
    user = conn.assigns.current_user
    
    with {:ok, target_user} <- Accounts.get_user(target_user_id),
         :ok <- validate_not_self(user, target_user),
         :ok <- validate_not_blocked(user, target_user),
         :ok <- validate_not_already_friends(user, target_user),
         {:ok, friendship} <- Accounts.send_friend_request(user, target_user) do
      # Notify target user
      Accounts.notify_friend_request(friendship)
      
      conn
      |> put_status(:created)
      |> render(:show, friendship: friendship)
    end
  end

  @doc """
  Accept a friend request.
  PUT /api/v1/friends/:id/accept
  """
  def accept(conn, %{"id" => friendship_id}) do
    user = conn.assigns.current_user
    
    with {:ok, friendship} <- Accounts.get_friend_request(user, friendship_id),
         :ok <- validate_is_recipient(user, friendship),
         {:ok, updated_friendship} <- Accounts.accept_friend_request(friendship) do
      # Notify requester
      Accounts.notify_friend_accepted(updated_friendship)
      
      render(conn, :show, friendship: updated_friendship)
    end
  end

  @doc """
  Decline a friend request.
  PUT /api/v1/friends/:id/decline
  """
  def decline(conn, %{"id" => friendship_id}) do
    user = conn.assigns.current_user
    
    with {:ok, friendship} <- Accounts.get_friend_request(user, friendship_id),
         :ok <- validate_is_recipient(user, friendship),
         {:ok, _} <- Accounts.decline_friend_request(friendship) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Cancel a sent friend request.
  DELETE /api/v1/friends/:id
  """
  def delete(conn, %{"id" => friendship_id}) do
    user = conn.assigns.current_user
    
    with {:ok, friendship} <- Accounts.get_friendship(user, friendship_id),
         {:ok, _} <- Accounts.remove_friendship(user, friendship) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Unfriend a user.
  DELETE /api/v1/friends/user/:user_id
  """
  def unfriend(conn, %{"user_id" => target_user_id}) do
    user = conn.assigns.current_user
    
    with {:ok, target_user} <- Accounts.get_user(target_user_id),
         {:ok, _} <- Accounts.unfriend(user, target_user) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Block a user.
  POST /api/v1/friends/:id/block
  """
  def block(conn, %{"id" => target_user_id}) do
    user = conn.assigns.current_user
    
    with {:ok, target_user} <- Accounts.get_user(target_user_id),
         :ok <- validate_not_self(user, target_user),
         {:ok, block} <- Accounts.block_user(user, target_user) do
      conn
      |> put_status(:created)
      |> render(:block, block: block)
    end
  end

  @doc """
  Unblock a user.
  DELETE /api/v1/friends/:id/block
  """
  def unblock(conn, %{"id" => target_user_id}) do
    user = conn.assigns.current_user
    
    with {:ok, target_user} <- Accounts.get_user(target_user_id),
         {:ok, _} <- Accounts.unblock_user(user, target_user) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  List blocked users.
  GET /api/v1/friends/blocked
  """
  def blocked(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "50") |> String.to_integer() |> min(100)
    
    {blocked_users, meta} = Accounts.list_blocked_users(user,
      page: page,
      per_page: per_page
    )
    
    render(conn, :blocked, users: blocked_users, meta: meta)
  end

  @doc """
  Get mutual friends with another user.
  GET /api/v1/friends/:id/mutual
  """
  def mutual(conn, %{"id" => target_user_id}) do
    user = conn.assigns.current_user
    
    with {:ok, target_user} <- Accounts.get_user(target_user_id) do
      mutual_friends = Accounts.get_mutual_friends(user, target_user)
      render(conn, :mutual, friends: mutual_friends)
    end
  end

  @doc """
  Get online friends.
  GET /api/v1/friends/online
  """
  def online(conn, _params) do
    user = conn.assigns.current_user
    
    online_friends = Accounts.get_online_friends(user)
    render(conn, :online, friends: online_friends)
  end

  @doc """
  Get pending friend requests (alias for requests).
  GET /api/v1/friends/pending
  """
  def pending(conn, params) do
    requests(conn, params)
  end

  @doc """
  Get friend suggestions based on mutual friends and activity.
  GET /api/v1/friends/suggestions
  """
  def suggestions(conn, params) do
    user = conn.assigns.current_user
    limit = Map.get(params, "limit", "10") |> String.to_integer() |> min(20)
    
    suggestions = Accounts.get_friend_suggestions(user, limit: limit)
    render(conn, :suggestions, suggestions: suggestions)
  end

  # Private helpers

  defp validate_not_self(user, target_user) do
    if user.id == target_user.id do
      {:error, :cannot_friend_self}
    else
      :ok
    end
  end

  defp validate_not_blocked(user, target_user) do
    cond do
      Accounts.is_blocked?(user, target_user) ->
        {:error, :user_blocked}
      
      Accounts.is_blocked?(target_user, user) ->
        {:error, :blocked_by_user}
      
      true ->
        :ok
    end
  end

  defp validate_not_already_friends(user, target_user) do
    case Accounts.get_friendship_status(user, target_user) do
      :none -> :ok
      :pending -> {:error, :request_already_sent}
      :incoming -> {:error, :request_pending}
      :friends -> {:error, :already_friends}
    end
  end

  defp validate_is_recipient(user, friendship) do
    if friendship.friend_id == user.id do
      :ok
    else
      {:error, :not_recipient}
    end
  end
end
