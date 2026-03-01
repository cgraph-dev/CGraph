defmodule CGraphWeb.API.V1.GroupModerationController do
  @moduledoc """
  REST controller for group-scoped moderation.

  Provides endpoints for group moderators to list, view, and act on
  reports targeting content within their group. Separate from the
  platform-admin moderation controller.

  ## Endpoints

  - `GET /api/v1/groups/:group_id/moderation/reports` — List group reports
  - `GET /api/v1/groups/:group_id/moderation/reports/:id` — Report detail
  - `POST /api/v1/groups/:group_id/moderation/reports/:id/review` — Take action
  - `GET /api/v1/groups/:group_id/moderation/stats` — Dashboard stats
  """

  use CGraphWeb, :controller

  alias CGraph.Groups
  alias CGraph.Groups.Moderation, as: GroupModeration

  action_fallback CGraphWeb.FallbackController

  @doc """
  List reports targeting content in this group.

  ## Query Parameters

  - `status` — pending, reviewing, resolved, dismissed
  - `page` — Page number (default 1)
  - `per_page` — Results per page (default 20, max 100)
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"group_id" => group_id} = params) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- authorize_moderator(user, group) do
      opts = [
        status: params["status"],
        page: parse_int(params["page"], 1),
        limit: parse_int(params["per_page"], 20)
      ]

      {reports, meta} = GroupModeration.list_group_reports(group_id, opts)

      conn
      |> put_status(:ok)
      |> json(%{
        data: Enum.map(reports, &render_report/1),
        meta: meta
      })
    end
  end

  @doc """
  Get detailed information about a specific group report.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"group_id" => group_id, "id" => report_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- authorize_moderator(user, group),
         {:ok, report} <- GroupModeration.get_group_report(group_id, report_id) do
      conn
      |> put_status(:ok)
      |> json(%{data: render_report_detail(report)})
    end
  end

  @doc """
  Review and take action on a group report.

  ## Request Body

  - `action` — dismiss, warn, remove_content, suspend, ban
  - `notes` — Internal moderator notes
  - `duration_hours` — For suspensions
  """
  @spec review(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def review(conn, %{"group_id" => group_id, "id" => report_id} = params) do
    user = conn.assigns.current_user

    attrs = %{
      action: normalize_atom(params["action"]),
      notes: params["notes"],
      duration_hours: params["duration_hours"]
    }

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- authorize_moderator(user, group),
         {:ok, report} <- GroupModeration.review_group_report(report_id, user.id, group_id, attrs) do
      conn
      |> put_status(:ok)
      |> json(%{
        data: render_report(report),
        message: "Report reviewed successfully"
      })
    end
  end

  @doc """
  Moderation dashboard statistics for the group.
  """
  @spec stats(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def stats(conn, %{"group_id" => group_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- authorize_moderator(user, group) do
      stats = GroupModeration.group_moderation_stats(group_id)

      conn
      |> put_status(:ok)
      |> json(%{data: stats})
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp authorize_moderator(user, group) do
    if group.owner_id == user.id do
      :ok
    else
      member = Groups.get_member_by_user(group, user.id)

      cond do
        is_nil(member) ->
          {:error, :not_found}

        Groups.Roles.has_permission?(member, :manage_messages) ->
          :ok

        Groups.Roles.has_permission?(member, :ban_members) ->
          :ok

        true ->
          {:error, :insufficient_permissions}
      end
    end
  end

  defp render_report(report) do
    %{
      id: report.id,
      target_type: report.target_type,
      target_id: report.target_id,
      category: report.category,
      status: report.status,
      priority: report.priority,
      created_at: report.inserted_at,
      reviewed_at: report.reviewed_at
    }
  end

  defp render_report_detail(report) do
    render_report(report)
    |> Map.merge(%{
      description: report.description,
      evidence_urls: report.evidence_urls,
      reporter:
        report.reporter &&
          %{
            id: report.reporter.id,
            username: report.reporter.username
          },
      actions:
        Enum.map(report.review_actions || [], fn action ->
          %{
            id: action.id,
            action: action.action,
            notes: action.notes,
            reviewer:
              action.reviewer &&
                %{id: action.reviewer.id, username: action.reviewer.username},
            created_at: action.inserted_at
          }
        end)
    })
  end

  defp normalize_atom(nil), do: nil

  defp normalize_atom(value) when is_binary(value) do
    String.to_existing_atom(value)
  rescue
    ArgumentError -> nil
  end

  defp parse_int(nil, default), do: default

  defp parse_int(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {int, _} -> int
      :error -> default
    end
  end

  defp parse_int(value, _default) when is_integer(value), do: value
end
