defmodule CgraphWeb.FriendController do
  @moduledoc """
  Controller for friend management endpoints.
  """

  use CgraphWeb, :controller

  alias Cgraph.Accounts.Friends
  alias Cgraph.Guardian

  action_fallback CgraphWeb.FallbackController

  @doc """
  Lists user's friends.

  GET /api/v1/friends
  """
  def index(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    limit = Map.get(params, "limit", "50") |> String.to_integer()
    offset = Map.get(params, "offset", "0") |> String.to_integer()

    friends = Friends.list_friends(user.id, limit: limit, offset: offset)

    conn
    |> put_status(:ok)
    |> json(%{friends: friends})
  end

  @doc """
  Gets friend statistics.

  GET /api/v1/friends/stats
  """
  def stats(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    stats = Friends.get_friend_stats(user.id)

    conn
    |> put_status(:ok)
    |> json(stats)
  end

  @doc """
  Gets incoming friend requests.

  GET /api/v1/friends/requests/incoming
  """
  def incoming_requests(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    requests = Friends.list_incoming_requests(user.id)

    conn
    |> put_status(:ok)
    |> json(%{requests: requests})
  end

  @doc """
  Gets outgoing friend requests.

  GET /api/v1/friends/requests/outgoing
  """
  def outgoing_requests(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    requests = Friends.list_outgoing_requests(user.id)

    conn
    |> put_status(:ok)
    |> json(%{requests: requests})
  end

  @doc """
  Sends a friend request.

  POST /api/v1/friends/requests
  Body: { "user_id": "uuid" } or { "username": "string" }
  """
  def send_request(conn, %{"user_id" => to_user_id}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.send_friend_request(user.id, to_user_id) do
      {:ok, _friendship} ->
        conn
        |> put_status(:created)
        |> json(%{success: true, message: "Friend request sent"})

      {:error, :already_friends} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "already_friends", message: "You are already friends with this user"})

      {:error, :request_already_sent} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "request_already_sent", message: "Friend request already pending"})

      {:error, :blocked_by_user} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "blocked", message: "Cannot send friend request to this user"})

      {:error, :user_blocked} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "user_blocked", message: "You have blocked this user"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: format_errors(changeset)})
    end
  end

  @doc """
  Accepts a friend request.

  POST /api/v1/friends/requests/:id/accept
  """
  def accept_request(conn, %{"id" => from_user_id}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.accept_friend_request(user.id, from_user_id) do
      {:ok, :ok} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "Friend request accepted"})

      {:error, :request_not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_found", message: "Friend request not found"})
    end
  end

  @doc """
  Declines a friend request.

  POST /api/v1/friends/requests/:id/decline
  """
  def decline_request(conn, %{"id" => from_user_id}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.decline_friend_request(user.id, from_user_id) do
      {:ok, _} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "Friend request declined"})

      {:error, :request_not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_found", message: "Friend request not found"})
    end
  end

  @doc """
  Cancels a sent friend request.

  DELETE /api/v1/friends/requests/:id
  """
  def cancel_request(conn, %{"id" => to_user_id}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.cancel_friend_request(user.id, to_user_id) do
      {:ok, _} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "Friend request cancelled"})

      {:error, :request_not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_found", message: "Friend request not found"})
    end
  end

  @doc """
  Removes a friend.

  DELETE /api/v1/friends/:id
  """
  def remove(conn, %{"id" => friend_id}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.remove_friend(user.id, friend_id) do
      {:ok, :ok} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "Friend removed"})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})
    end
  end

  @doc """
  Blocks a user.

  POST /api/v1/friends/block
  Body: { "user_id": "uuid" }
  """
  def block(conn, %{"user_id" => blocked_id}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.block_user(user.id, blocked_id) do
      {:ok, :ok} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "User blocked"})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})
    end
  end

  @doc """
  Unblocks a user.

  DELETE /api/v1/friends/block/:id
  """
  def unblock(conn, %{"id" => blocked_id}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.unblock_user(user.id, blocked_id) do
      {:ok, _} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "User unblocked"})

      {:error, :not_blocked} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_blocked", message: "User is not blocked"})
    end
  end

  @doc """
  Gets list of blocked users.

  GET /api/v1/friends/blocked
  """
  def blocked(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    blocked = Friends.list_blocked_users(user.id)

    conn
    |> put_status(:ok)
    |> json(%{blocked: blocked})
  end

  @doc """
  Gets mutual friends with another user.

  GET /api/v1/friends/mutual/:user_id
  """
  def mutual(conn, %{"user_id" => other_id}) do
    user = Guardian.Plug.current_resource(conn)
    mutual = Friends.get_mutual_friends(user.id, other_id)

    conn
    |> put_status(:ok)
    |> json(%{mutual_friends: mutual, count: length(mutual)})
  end

  @doc """
  Gets friend suggestions.

  GET /api/v1/friends/suggestions
  """
  def suggestions(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    limit = Map.get(params, "limit", "10") |> String.to_integer()

    suggestions = Friends.get_friend_suggestions(user.id, limit)

    conn
    |> put_status(:ok)
    |> json(%{suggestions: suggestions})
  end

  @doc """
  Sets a nickname for a friend.

  PUT /api/v1/friends/:id/nickname
  Body: { "nickname": "string" }
  """
  def set_nickname(conn, %{"id" => friend_id, "nickname" => nickname}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.set_friend_nickname(user.id, friend_id, nickname) do
      {:ok, _} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "Nickname updated"})

      {:error, :not_friends} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_friends", message: "You are not friends with this user"})
    end
  end

  @doc """
  Removes nickname for a friend.

  DELETE /api/v1/friends/:id/nickname
  """
  def remove_nickname(conn, %{"id" => friend_id}) do
    user = Guardian.Plug.current_resource(conn)

    case Friends.remove_friend_nickname(user.id, friend_id) do
      {:ok, _} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "Nickname removed"})

      {:error, :not_friends} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_friends", message: "You are not friends with this user"})
    end
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
