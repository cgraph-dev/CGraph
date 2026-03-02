defmodule CGraphWeb.API.Admin.ModerationController do
  @moduledoc """
  Admin API controller for content moderation.

  Provides moderator/admin-only endpoints for reviewing and
  acting on reports.

  ## Endpoints

  - `GET /api/admin/reports` - List pending reports
  - `GET /api/admin/reports/:id` - Get report details
  - `POST /api/admin/reports/:id/review` - Review and action a report
  - `GET /api/admin/appeals` - List pending appeals
  - `POST /api/admin/appeals/:id/review` - Review an appeal
  - `GET /api/admin/stats` - Moderation statistics
  """

  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Moderation
  alias CGraph.Moderation.{Appeal, Report}

  action_fallback CGraphWeb.FallbackController

  plug :require_moderator

  # ---------------------------------------------------------------------------
  # Reports
  # ---------------------------------------------------------------------------

  @doc """
  List reports in the moderation queue.

  ## Query Parameters

  - `status` - Filter by status (pending, reviewing, resolved, dismissed)
  - `category` - Filter by category
  - `priority` - Filter by priority (critical, high, normal, low)
  - `limit` - Number of results (default 50, max 100)
  """
  @spec list_reports(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_reports(conn, params) do
    opts = [
      status: normalize_atom(params["status"], :pending),
      category: normalize_atom(params["category"]),
      priority: normalize_atom(params["priority"]),
      limit: to_integer(params["limit"], 50) |> min(100)
    ]

    reports = Moderation.list_reports(opts)
    counts = Moderation.pending_report_counts()

    conn
    |> put_status(:ok)
    |> json(%{
      data: Enum.map(reports, &render_report/1),
      meta: %{
        pending_counts: counts
      }
    })
  end

  @doc """
  Get detailed information about a specific report.
  """
  @spec show_report(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show_report(conn, %{"id" => id}) do
    case CGraph.Repo.get(Report, id) |> CGraph.Repo.preload([:reporter, :review_actions]) do
      nil ->
        render_error(conn, :not_found, "Report not found")

      report ->
        render_data(conn, render_report_detail(report))
    end
  end

  @doc """
  Review and take action on a report.

  ## Request Body

  ```json
  {
    "action": "warn",
    "notes": "First offense, issued warning",
    "duration_hours": null,
    "notify_reporter": true
  }
  ```

  ## Actions

  - `dismiss` - Report invalid, no action taken
  - `warn` - Issue warning to user
  - `remove_content` - Delete the reported content
  - `suspend` - Temporarily suspend user (requires duration_hours)
  - `ban` - Permanently ban user
  """
  @doc "Reviews a moderation report as admin."
  @spec review_report(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def review_report(conn, %{"id" => id} = params) do
    reviewer = conn.assigns.current_user

    attrs = %{
      action: normalize_atom(params["action"]),
      notes: params["notes"],
      duration_hours: params["duration_hours"],
      notify_reporter: params["notify_reporter"] == true
    }

    case Moderation.review_report(reviewer, id, attrs) do
      {:ok, report} ->
        render_data(conn, %{
          report: render_report(report),
          message: "Report reviewed successfully"
        })

      {:error, :not_found} ->
        render_error(conn, 404, "Report not found")

      {:error, :unauthorized} ->
        render_error(conn, 403, "Insufficient permissions")

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: CGraphWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)
    end
  end

  # ---------------------------------------------------------------------------
  # Appeals
  # ---------------------------------------------------------------------------

  @doc """
  List pending appeals.
  """
  @spec list_appeals(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_appeals(conn, params) do
    limit = to_integer(params["limit"], 50) |> min(100)
    appeals = Moderation.list_appeals(limit: limit)

    render_data(conn, Enum.map(appeals, &render_appeal/1))
  end

  @doc """
  Review an appeal.

  ## Request Body

  ```json
  {
    "approved": true,
    "notes": "Appeal approved, action was too severe"
  }
  ```
  """
  @spec review_appeal(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def review_appeal(conn, %{"id" => id} = params) do
    reviewer = conn.assigns.current_user

    attrs = %{
      approved: params["approved"] == true,
      notes: params["notes"]
    }

    case Moderation.review_appeal(reviewer, id, attrs) do
      {:ok, appeal} ->
        render_data(conn, %{
          appeal: render_appeal(appeal),
          message: "Appeal reviewed successfully"
        })

      {:error, :not_found} ->
        render_error(conn, :not_found, "Appeal not found")

      {:error, :unauthorized} ->
        render_error(conn, :forbidden, "Insufficient permissions")
    end
  end

  # ---------------------------------------------------------------------------
  # Statistics
  # ---------------------------------------------------------------------------

  @doc """
  Get moderation statistics.
  """
  @spec stats(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def stats(conn, params) do
    days = to_integer(params["days"], 30)
    stats = CGraph.Moderation.Stats.comprehensive_stats(days)

    render_data(conn, %{
      reports_today: stats.reports_today,
      avg_response_time: stats.avg_response_time,
      active_restrictions: stats.active_restrictions,
      resolution_rate: stats.resolution_rate,
      reports_by_category: stats.reports_by_category,
      reports_trend: Enum.map(stats.reports_trend, fn item ->
        %{date: item.date, count: item.count}
      end),
      moderator_leaderboard: Enum.map(stats.moderator_leaderboard, fn mod ->
        %{
          reviewer_id: mod.reviewer_id,
          username: mod[:username],
          display_name: mod[:display_name],
          actions_count: mod.actions_count,
          last_action: mod.last_action
        }
      end),
      ai_stats: Enum.map(stats.ai_stats, fn item ->
        %{
          ai_action: item.ai_action,
          auto_actioned: item.auto_actioned,
          count: item.count
        }
      end),
      appeals_stats: stats.appeals_stats
    })
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp require_moderator(conn, _opts) do
    user = conn.assigns[:current_user]

    if user && user.is_admin do
      conn
    else
      render_error(conn, :forbidden, "Moderator access required")
      |> halt()
    end
  end

  defp render_report(%Report{} = report) do
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

  defp render_report_detail(%Report{} = report) do
    render_report(report)
    |> Map.merge(%{
      description: report.description,
      evidence_urls: report.evidence_urls,
      reporter: report.reporter && %{
        id: report.reporter.id,
        username: report.reporter.username
      },
      actions: Enum.map(report.review_actions || [], fn action ->
        %{
          id: action.id,
          action: action.action,
          notes: action.notes,
          created_at: action.inserted_at
        }
      end)
    })
  end

  defp render_appeal(%Appeal{} = appeal) do
    %{
      id: appeal.id,
      user_id: appeal.user_id,
      reason: appeal.reason,
      status: appeal.status,
      created_at: appeal.inserted_at,
      reviewed_at: appeal.reviewed_at
    }
  end

  defp normalize_atom(nil), do: nil
  defp normalize_atom(value) when is_binary(value) do
    String.to_existing_atom(value)
  rescue
    ArgumentError -> nil
  end
  defp normalize_atom(value, default), do: normalize_atom(value) || default

  defp to_integer(nil, default), do: default
  defp to_integer(value, default) when is_binary(value) do
    case Integer.parse(value) do
      {int, _} -> int
      :error -> default
    end
  end
  defp to_integer(value, _default) when is_integer(value), do: value
end
