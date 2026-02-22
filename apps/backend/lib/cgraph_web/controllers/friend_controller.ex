defmodule CGraphWeb.FriendController do
  @moduledoc """
  Friend management endpoints.
  """

  use CGraphWeb, :controller

  alias CGraph.Accounts
  alias CGraph.Accounts.Friends
  alias CGraph.Guardian
  import CGraphWeb.ControllerHelpers, only: [safe_to_integer: 2]

  action_fallback CGraphWeb.FallbackController

  @doc """
  Sends a friend request.

  POST /api/v1/friends
  Body can contain one of: user_id, username, email, or uid
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, params) do
    user = Guardian.Plug.current_resource(conn)

    with {:ok, target_user} <- resolve_target_user(params),
         :ok <- validate_not_self(user, target_user) do
      case Friends.send_friend_request(user.id, target_user.id) do
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
    else
      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "user_not_found", message: "User not found"})

      {:error, :self_request} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "self_request", message: "You cannot send a friend request to yourself"})

      {:error, :missing_identifier} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "missing_identifier", message: "Please provide user_id, username, email, or uid"})
    end
  end

  # Resolves a target user from various identifier types
  defp resolve_target_user(%{"user_id" => user_id}) when is_binary(user_id) do
    Accounts.get_user(user_id)
  end

  defp resolve_target_user(%{"username" => username}) when is_binary(username) do
    Accounts.get_user_by_username(username)
  end

  defp resolve_target_user(%{"email" => email}) when is_binary(email) do
    Accounts.get_user_by_email(email)
  end

  defp resolve_target_user(%{"uid" => uid}) when is_binary(uid) do
    Accounts.get_user_by_user_id(uid)
  end

  defp resolve_target_user(_), do: {:error, :missing_identifier}

  defp validate_not_self(user, target_user) do
    if user.id == target_user.id do
      {:error, :self_request}
    else
      :ok
    end
  end

  @doc """
  Lists user's friends.

  GET /api/v1/friends
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    limit = safe_to_integer(Map.get(params, "limit"), 50) |> min(100)
    cursor = Map.get(params, "cursor")

    friends = Friends.list_friends(user.id, limit: limit, cursor: cursor)

    conn
    |> put_status(:ok)
    |> json(%{friends: friends})
  end

  @doc """
  Gets friend statistics.

  GET /api/v1/friends/stats
  """
  @spec stats(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def stats(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    stats = Friends.get_friend_stats(user.id)

    conn
    |> put_status(:ok)
    |> json(stats)
  end

  @doc """
  Gets pending friend requests (alias for incoming_requests).

  GET /api/v1/friends/pending
  """
  @spec pending(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def pending(conn, params) do
    incoming_requests(conn, params)
  end

  @doc """
  Gets incoming friend requests.

  GET /api/v1/friends/requests/incoming
  """
  @spec incoming_requests(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec outgoing_requests(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec send_request(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec accept_request(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec decline_request(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec cancel_request(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec remove(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec block(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec unblock(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec blocked(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec mutual(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec suggestions(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def suggestions(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    limit = safe_to_integer(Map.get(params, "limit"), 10) |> min(50)

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
  @spec set_nickname(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec remove_nickname(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
