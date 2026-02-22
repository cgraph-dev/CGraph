defmodule CGraphWeb.API.V1.FriendController do
  @moduledoc """
  Handles friend relationships.
  Supports sending/accepting requests, listing friends, blocking users.
  """
  use CGraphWeb, :controller

  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Accounts

  action_fallback CGraphWeb.FallbackController

  @max_per_page 100
  @max_suggestions 20

  @doc """
  List user's friends.
  GET /api/v1/friends
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 50, min: 1, max: @max_per_page)
    status = Map.get(params, "status", "accepted") # accepted, pending, blocked

    {friends, meta} = Accounts.list_friends(user,
      page: page,
      per_page: per_page,
      status: status
    )

    render(conn, :index, friends: friends, meta: meta)
  end

  @doc """
  Get a specific friendship.
  GET /api/v1/friends/:id
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => friendship_id}) do
    user = conn.assigns.current_user

    with {:ok, friendship} <- Accounts.get_friendship(user, friendship_id) do
      render(conn, :show, friendship: friendship)
    end
  end

  @doc """
  Get pending friend requests (received).
  GET /api/v1/friends/requests
  """
  @spec requests(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def requests(conn, params) do
    user = conn.assigns.current_user
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 20, min: 1, max: 50)

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
  @spec sent(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def sent(conn, params) do
    user = conn.assigns.current_user
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 20, min: 1, max: 50)

    {requests, meta} = Accounts.list_sent_friend_requests(user,
      page: page,
      per_page: per_page
    )

    render(conn, :sent, requests: requests, meta: meta)
  end

  @doc """
  Send a friend request.
  POST /api/v1/friends
  Accepts user_id (UUID), username, email, or uid (numeric user ID like #0001).
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
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

  def create(conn, %{"uid" => uid}) do
    user = conn.assigns.current_user

    with {:ok, target_user} <- Accounts.get_user_by_user_id(uid),
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

  def create(conn, %{"email" => email}) do
    user = conn.assigns.current_user

    with {:ok, target_user} <- Accounts.get_user_by_email(email),
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

  def create(conn, %{"username" => username}) do
    user = conn.assigns.current_user

    with {:ok, target_user} <- Accounts.get_user_by_username(username),
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
  @spec accept(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec decline(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec unfriend(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec block(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec unblock(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec blocked(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def blocked(conn, params) do
    user = conn.assigns.current_user
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 50, min: 1, max: @max_per_page)

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
  @spec mutual(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec online(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def online(conn, _params) do
    user = conn.assigns.current_user

    online_friends = Accounts.get_online_friends(user)
    render(conn, :online, friends: online_friends)
  end

  @doc """
  Get pending friend requests (alias for requests).
  GET /api/v1/friends/pending
  """
  @spec pending(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def pending(conn, params) do
    requests(conn, params)
  end

  @doc """
  Get friend suggestions based on mutual friends and activity.
  GET /api/v1/friends/suggestions
  """
  @spec suggestions(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def suggestions(conn, params) do
    user = conn.assigns.current_user
    limit = parse_int(params["limit"], 10, min: 1, max: @max_suggestions)

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
      Accounts.blocked?(user, target_user) ->
        {:error, :user_blocked}

      Accounts.blocked?(target_user, user) ->
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
