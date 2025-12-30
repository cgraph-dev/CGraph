defmodule CgraphWeb.API.V1.UserController do
  @moduledoc """
  Controller for user-related endpoints.
  Handles current user operations and user lookups.
  """
  use CgraphWeb, :controller

  alias Cgraph.Accounts
  alias Cgraph.Accounts.User

  action_fallback CgraphWeb.FallbackController

  @doc """
  Get the current authenticated user's profile.
  """
  def me(conn, _params) do
    user = conn.assigns.current_user
    render(conn, :show, user: user)
  end

  @doc """
  Update the current user's profile.
  """
  def update(conn, %{"user" => user_params}) do
    user = conn.assigns.current_user

    with {:ok, %User{} = updated_user} <- Accounts.update_user(user, user_params) do
      render(conn, :show, user: updated_user)
    end
  end

  def update(conn, params) do
    # Handle case where params aren't wrapped in "user" key
    update(conn, %{"user" => params})
  end

  @doc """
  Delete the current user's account (soft delete with grace period).
  """
  def delete(conn, _params) do
    user = conn.assigns.current_user

    with {:ok, _user} <- Accounts.schedule_user_deletion(user) do
      conn
      |> put_status(:ok)
      |> json(%{
        message: "Account scheduled for deletion. You have 30 days to recover it.",
        deletion_scheduled_at: DateTime.utc_now() |> DateTime.to_iso8601()
      })
    end
  end

  @doc """
  Upload a new avatar for the current user.
  """
  def upload_avatar(conn, %{"file" => upload}) do
    user = conn.assigns.current_user

    with {:ok, url} <- Accounts.upload_avatar(user, upload),
         {:ok, updated_user} <- Accounts.update_user(user, %{avatar_url: url}) do
      render(conn, :show, user: updated_user)
    end
  end

  @doc """
  List all active sessions for the current user.
  """
  def sessions(conn, _params) do
    user = conn.assigns.current_user
    sessions = Accounts.list_user_sessions(user)
    
    current_token = get_req_header(conn, "authorization")
    |> List.first()
    |> case do
      "Bearer " <> token -> token
      _ -> nil
    end

    render(conn, :sessions, sessions: sessions, current_token: current_token)
  end

  @doc """
  Revoke a specific session.
  """
  def revoke_session(conn, %{"id" => session_id}) do
    user = conn.assigns.current_user

    with {:ok, _session} <- Accounts.revoke_session(user, session_id) do
      conn
      |> put_status(:ok)
      |> json(%{message: "Session revoked successfully"})
    end
  end

  @doc """
  List users with pagination and optional search.
  """
  def index(conn, params) do
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(100)
    search = Map.get(params, "q")

    {users, total} = Accounts.list_users(
      page: page,
      per_page: per_page,
      search: search
    )

    render(conn, :index,
      users: users,
      meta: %{page: page, per_page: per_page, total: total}
    )
  end

  @doc """
  Get a specific user by ID.
  """
  def show(conn, %{"id" => id}) do
    with {:ok, user} <- Accounts.get_user(id) do
      render(conn, :show, user: user)
    end
  end

  @doc """
  Get a user's public profile by username.
  """
  def profile(conn, %{"username" => username}) do
    with {:ok, user} <- Accounts.get_user_by_username(username) do
      render(conn, :profile, user: user)
    end
  end

  @doc """
  Get top users by karma (leaderboard).
  """
  def leaderboard(conn, params) do
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(100)

    {users, meta} = Accounts.list_top_users_by_karma(
      page: page,
      per_page: per_page
    )

    render(conn, :leaderboard, users: users, meta: meta)
  end
end
