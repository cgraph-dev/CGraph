defmodule CgraphWeb.API.V1.UserController do
  @moduledoc """
  Controller for user-related endpoints.
  Handles current user operations and user lookups.
  """
  use CgraphWeb, :controller

  alias Cgraph.Accounts
  alias Cgraph.Accounts.User
  alias Cgraph.Presence

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
  Change the current user's username (14-day cooldown).
  """
  def change_username(conn, %{"username" => username}) do
    user = conn.assigns.current_user

    case Accounts.change_username(user, username) do
      {:ok, updated_user} ->
        render(conn, :show, user: updated_user)
      
      {:error, %Ecto.Changeset{} = changeset} ->
        errors = Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
          Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
            opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
          end)
        end)
        
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: format_changeset_error(errors)}})
    end
  end

  defp format_changeset_error(errors) do
    Enum.map_join(errors, "; ", fn {field, messages} ->
      "#{field}: #{Enum.join(messages, ", ")}"
    end)
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

  @doc """
  Request a data export for the current user (GDPR compliance).
  
  The export will be generated asynchronously and the user will be notified
  when it's ready to download.
  """
  def request_data_export(conn, _params) do
    user = conn.assigns.current_user

    case Cgraph.DataExport.export_user_data(user.id, [
      format: :json,
      include_messages: true,
      include_posts: true,
      include_comments: true,
      include_groups: true,
      include_friends: true,
      include_settings: true
    ]) do
      {:ok, export} ->
        conn
        |> put_status(:accepted)
        |> json(%{
          message: "Data export requested. You will be notified when it's ready.",
          export_id: export.id,
          status: export.status
        })
      
      {:error, :rate_limited} ->
        conn
        |> put_status(:too_many_requests)
        |> json(%{error: "You can only request one data export per day. Please try again later."})
      
      {:error, reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to start data export: #{inspect(reason)}"})
    end
  end

  @doc """
  Get presence status for a specific user (WhatsApp-style).
  
  Returns:
  - `online: true/false` - whether user is currently connected
  - `last_seen` - ISO8601 timestamp of last activity (if offline)
  - `status` - user's current status (online, away, busy, etc.)
  - `status_message` - optional custom status message
  """
  def presence(conn, %{"id" => user_id}) do
    presence_data = case Presence.user_online?(user_id) do
      true ->
        # get_user_presence returns already-merged presence data
        merged = Presence.get_user_presence(user_id) || %{}
        
        %{
          online: true,
          status: merged[:status] || "online",
          status_message: merged[:status_message],
          last_active: merged[:last_active] && DateTime.to_iso8601(merged[:last_active])
        }
        
      false ->
        last_seen = Presence.last_seen(user_id)
        
        %{
          online: false,
          status: "offline",
          last_seen: last_seen && DateTime.to_iso8601(last_seen)
        }
    end
    
    conn
    |> put_status(:ok)
    |> json(%{data: presence_data})
  end

  @doc """
  Get presence status for multiple users (bulk endpoint).
  
  Accepts up to 100 user IDs per request.
  Useful for contact lists and conversation views.
  """
  def bulk_presence(conn, %{"user_ids" => user_ids}) when is_list(user_ids) do
    # Limit to prevent abuse
    limited_ids = Enum.take(user_ids, 100)
    
    # bulk_status returns {user_id, status_string} map
    status_map = Presence.bulk_status(limited_ids)
    
    # Enrich offline users with last_seen and convert to proper format
    enriched = Enum.map(limited_ids, fn user_id ->
      status = Map.get(status_map, user_id, "offline")
      is_online = status != "offline"
      
      base_data = %{
        online: is_online,
        status: status
      }
      
      data = if is_online do
        base_data
      else
        last_seen = Presence.last_seen(user_id)
        Map.put(base_data, :last_seen, last_seen && DateTime.to_iso8601(last_seen))
      end
      
      {user_id, data}
    end)
    |> Map.new()
    
    conn
    |> put_status(:ok)
    |> json(%{data: enriched})
  end

  def bulk_presence(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "user_ids array required"})
  end
end
