defmodule CGraphWeb.API.V1.ForumAdminController do
  @moduledoc """
  Admin controller for custom forum management.

  Provides endpoints for creating forums, updating settings,
  managing members, and viewing moderation logs.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_data: 3, render_error: 3]
  import Ecto.Query, warn: false

  alias CGraph.Forums.{CustomForum, ForumMember, ModerationLog}
  alias CGraph.Repo

  action_fallback CGraphWeb.FallbackController

  @doc """
  POST /api/v1/forum-admin/forums
  Creates a new custom forum owned by the current user.
  """
  def create_forum(conn, params) do
    user = conn.assigns.current_user

    attrs =
      params
      |> Map.take(~w(name slug description theme rules icon_url banner_url is_private invite_only))
      |> Map.put("owner_id", user.id)

    case %CustomForum{} |> CustomForum.changeset(attrs) |> Repo.insert() do
      {:ok, forum} ->
        conn
        |> put_status(:created)
        |> render_data(%{forum: forum})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render_error(422, format_errors(changeset))
    end
  end

  @doc """
  PUT /api/v1/forum-admin/forums/:id
  Updates forum settings. Only the owner can update.
  """
  def update_settings(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    case Repo.get(CustomForum, id) do
      nil ->
        render_error(conn, 404, "forum_not_found")

      %CustomForum{owner_id: owner_id} = forum when owner_id == user.id ->
        attrs = Map.take(params, ~w(name description theme rules icon_url banner_url is_private invite_only))

        case forum |> CustomForum.changeset(attrs) |> Repo.update() do
          {:ok, updated} ->
            render_data(conn, %{forum: updated})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> render_error(422, format_errors(changeset))
        end

      _forum ->
        render_error(conn, 403, "not_forum_owner")
    end
  end

  @doc """
  POST /api/v1/forum-admin/forums/:id/members
  Add, remove, or change role of a member. Body: {action, user_id, role?}
  """
  def manage_members(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    case Repo.get(CustomForum, id) do
      nil ->
        render_error(conn, 404, "forum_not_found")

      %CustomForum{owner_id: owner_id} when owner_id != user.id ->
        render_error(conn, 403, "not_forum_owner")

      %CustomForum{} = forum ->
        action = params["action"]
        target_user_id = params["user_id"]
        role = params["role"] || "member"

        execute_member_action(conn, user, forum, action, target_user_id, role)
    end
  end

  defp execute_member_action(conn, user, forum, "add", target_user_id, role) do
    attrs = %{forum_id: forum.id, user_id: target_user_id, role: role}

    case %ForumMember{} |> ForumMember.changeset(attrs) |> Repo.insert() do
      {:ok, _member} ->
        log_moderation_action(user.id, "add_member", "user", target_user_id, %{role: role})
        render_data(conn, %{status: "member_added", user_id: target_user_id, role: role})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render_error(422, format_errors(changeset))
    end
  end

  defp execute_member_action(conn, user, forum, "remove", target_user_id, _role) do
    query = from(m in ForumMember, where: m.forum_id == ^forum.id and m.user_id == ^target_user_id)

    case Repo.delete_all(query) do
      {0, _} ->
        render_error(conn, 404, "member_not_found")

      {_count, _} ->
        log_moderation_action(user.id, "remove_member", "user", target_user_id)
        render_data(conn, %{status: "member_removed", user_id: target_user_id})
    end
  end

  defp execute_member_action(conn, user, forum, "change_role", target_user_id, role) do
    case Repo.get_by(ForumMember, forum_id: forum.id, user_id: target_user_id) do
      nil ->
        render_error(conn, 404, "member_not_found")

      member ->
        case member |> Ecto.Changeset.change(%{role: role}) |> Repo.update() do
          {:ok, _updated} ->
            log_moderation_action(user.id, "change_role", "user", target_user_id, %{role: role})
            render_data(conn, %{status: "role_changed", user_id: target_user_id, role: role})

          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> render_error(422, format_errors(changeset))
        end
    end
  end

  defp execute_member_action(conn, _user, _forum, _action, _target_user_id, _role) do
    render_error(conn, 400, "invalid_action")
  end

  @doc """
  GET /api/v1/forum-admin/forums/:id/moderation-log
  Lists moderation log entries with cursor pagination.
  """
  def moderation_log(conn, %{"id" => _id} = params) do
    cursor = params["cursor"]
    limit = min(String.to_integer(params["limit"] || "25"), 100)

    query =
      from(ml in ModerationLog,
        order_by: [desc: ml.inserted_at, desc: ml.id],
        limit: ^(limit + 1)
      )

    query =
      if cursor do
        from(ml in query, where: ml.id < ^cursor)
      else
        query
      end

    entries = Repo.all(query)
    has_more = length(entries) > limit
    entries = Enum.take(entries, limit)

    next_cursor =
      if has_more do
        entries |> List.last() |> Map.get(:id)
      end

    meta = %{has_more: has_more, next_cursor: next_cursor}
    render_data(conn, %{moderation_logs: entries}, meta)
  end

  # ===========================================================================
  # Private helpers
  # ===========================================================================

  defp log_moderation_action(moderator_id, action, target_type, target_id, metadata \\ %{}) do
    %ModerationLog{}
    |> ModerationLog.changeset(%{
      moderator_id: moderator_id,
      action: action,
      target_type: target_type,
      target_id: target_id,
      metadata: metadata
    })
    |> Repo.insert()
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
    |> inspect()
  end
end
