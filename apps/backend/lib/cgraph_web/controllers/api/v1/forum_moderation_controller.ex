defmodule CGraphWeb.API.V1.ForumModerationController do
  @moduledoc """
  Forum-specific moderation controller.

  Provides endpoints for:
  - Moderation queue management
  - Warning system
  - Automod rules
  - Moderation statistics

  Authorization: forum moderator or admin.
  """

  use CGraphWeb, :controller

  alias CGraph.Forums.{Moderation, ForumAutomod}
  alias CGraph.Repo

  action_fallback CGraphWeb.FallbackController

  # ── Authorization Plug ─────────────────────────────────────────────

  plug :authorize_moderator

  defp authorize_moderator(conn, _opts) do
    forum_id = conn.params["forum_id"]
    user = conn.assigns[:current_user]

    cond do
      is_nil(user) ->
        conn |> put_status(:unauthorized) |> json(%{error: "Not authenticated"}) |> halt()

      is_nil(forum_id) ->
        conn

      true ->
        forum = Repo.get(CGraph.Forums.Forum, forum_id)

        cond do
          is_nil(forum) ->
            conn |> put_status(:not_found) |> json(%{error: "Forum not found"}) |> halt()

          forum.owner_id == user.id ->
            conn

          Moderation.moderator?(forum, user) ->
            conn

          true ->
            conn |> put_status(:forbidden) |> json(%{error: "Not a moderator"}) |> halt()
        end
    end
  end

  # ── Queue ──────────────────────────────────────────────────────────

  @doc "GET /forums/:forum_id/moderation/queue"
  def queue(conn, %{"forum_id" => forum_id} = params) do
    forum = Repo.get!(CGraph.Forums.Forum, forum_id)

    opts = [
      status: params["status"] || "pending",
      cursor: params["cursor"],
      limit: parse_int(params["limit"], 20)
    ]

    {items, pagination} = Moderation.get_mod_queue(forum, opts)

    json(conn, %{
      data: Enum.map(items, &serialize_mod_item/1),
      pagination: pagination
    })
  end

  # ── Moderation Action ──────────────────────────────────────────────

  @doc "POST /forums/:forum_id/moderation/action"
  def action(conn, %{"forum_id" => _forum_id, "post_id" => post_id, "action" => mod_action}) do
    post = Repo.get!(CGraph.Forums.Post, post_id)

    case mod_action do
      "approve" ->
        Moderation.resolve_flag(post, :approve)
        json(conn, %{status: "approved"})

      "remove" ->
        Moderation.resolve_flag(post, :remove)
        json(conn, %{status: "removed"})

      "hide" ->
        reason = conn.params["reason"] || "Hidden by moderator"
        Moderation.hide_post(post_id, reason)
        json(conn, %{status: "hidden"})

      _ ->
        conn |> put_status(:bad_request) |> json(%{error: "Invalid action"})
    end
  end

  # ── Warnings ───────────────────────────────────────────────────────

  @doc "GET /forums/:forum_id/moderation/warnings?user_id=..."
  def warnings(conn, %{"forum_id" => forum_id} = params) do
    user_id = params["user_id"]

    if is_nil(user_id) do
      conn |> put_status(:bad_request) |> json(%{error: "user_id required"})
    else
      warnings = Moderation.list_warnings(forum_id, user_id)
      points = Moderation.active_warning_points(forum_id, user_id)

      json(conn, %{
        data: Enum.map(warnings, &serialize_warning/1),
        total_points: points
      })
    end
  end

  @doc "POST /forums/:forum_id/moderation/warn"
  def warn(conn, %{"forum_id" => forum_id} = params) do
    forum = Repo.get!(CGraph.Forums.Forum, forum_id)
    target_user = Repo.get!(CGraph.Accounts.User, params["user_id"])
    issuer = conn.assigns[:current_user]

    case Moderation.warn_user(forum, target_user, issuer, params) do
      {:ok, warning} ->
        conn
        |> put_status(:created)
        |> json(%{warning: serialize_warning(warning)})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to issue warning", details: inspect(changeset)})
    end
  end

  # ── Automod ────────────────────────────────────────────────────────

  @doc "GET /forums/:forum_id/moderation/automod"
  def automod(conn, %{"forum_id" => forum_id}) do
    case ForumAutomod.get_rules(forum_id) do
      {:ok, rules} -> json(conn, %{data: rules})
      {:error, :not_found} -> conn |> put_status(:not_found) |> json(%{error: "Forum not found"})
    end
  end

  @doc "PUT /forums/:forum_id/moderation/automod"
  def update_automod(conn, %{"forum_id" => forum_id} = params) do
    rules = Map.drop(params, ["forum_id"])

    case ForumAutomod.update_rules(forum_id, rules) do
      {:ok, updated} -> json(conn, %{data: updated})
      {:error, :not_found} -> conn |> put_status(:not_found) |> json(%{error: "Forum not found"})
      {:error, _} -> conn |> put_status(:unprocessable_entity) |> json(%{error: "Failed to update"})
    end
  end

  # ── Stats ──────────────────────────────────────────────────────────

  @doc "GET /forums/:forum_id/moderation/stats"
  def stats(conn, %{"forum_id" => forum_id}) do
    forum = Repo.get!(CGraph.Forums.Forum, forum_id)

    {pending_items, _} = Moderation.get_mod_queue(forum, status: "pending", limit: 0)
    {resolved_items, _} = Moderation.get_mod_queue(forum, status: "approved", limit: 0)

    json(conn, %{
      data: %{
        pending_count: length(pending_items),
        resolved_count: length(resolved_items),
        forum_id: forum_id
      }
    })
  end

  # ── Serializers ────────────────────────────────────────────────────

  defp serialize_mod_item(item) do
    %{
      id: item.id,
      content: Map.get(item, :content, nil),
      author_id: Map.get(item, :author_id, nil),
      is_flagged: Map.get(item, :is_flagged, false),
      flag_reason: Map.get(item, :flag_reason, nil),
      flagged_at: Map.get(item, :flagged_at, nil),
      moderation_status: Map.get(item, :moderation_status, nil),
      inserted_at: item.inserted_at
    }
  end

  defp serialize_warning(warning) do
    %{
      id: warning.id,
      reason: warning.reason,
      points: warning.points,
      expires_at: warning.expires_at,
      acknowledged: warning.acknowledged,
      revoked: warning.revoked,
      issued_by_id: warning.issued_by_id,
      inserted_at: warning.inserted_at
    }
  end

  defp parse_int(nil, default), do: default
  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {n, _} -> n
      :error -> default
    end
  end
  defp parse_int(val, _default) when is_integer(val), do: val
end
