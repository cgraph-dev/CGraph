defmodule CGraph.Moderation.Stats do
  @moduledoc """
  Moderation statistics and metrics queries.

  Provides aggregate data for the moderation dashboard, including
  report review counts, response times, active restrictions, reports
  by category, resolution rates, moderator leaderboards, AI auto-action
  stats, and appeals outcome distributions.
  """

  import Ecto.Query, warn: false

  alias CGraph.Moderation.{AuditLog, Report, ReviewAction, UserRestriction}
  alias CGraph.Moderation.Appeal
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Existing Stats
  # ---------------------------------------------------------------------------

  @doc """
  Get count of reports reviewed today.
  """
  @spec reports_reviewed_today() :: non_neg_integer()
  def reports_reviewed_today do
    today_start = DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.to_date() |> DateTime.new!(~T[00:00:00], "Etc/UTC")

    Repo.one(
      from r in Report,
        where: r.reviewed_at >= ^today_start,
        select: count(r.id)
    ) || 0
  end

  @doc """
  Get average response time for reports (in hours).
  """
  @spec average_response_time() :: float() | nil
  def average_response_time do
    result = Repo.one(
      from r in Report,
        where: not is_nil(r.reviewed_at),
        where: r.reviewed_at > r.inserted_at,
        select: avg(fragment("EXTRACT(EPOCH FROM (? - ?)) / 3600", r.reviewed_at, r.inserted_at))
    )

    case result do
      nil -> nil
      avg -> Float.round(avg, 1)
    end
  end

  @doc """
  Get count of currently active restrictions.
  """
  @spec active_restriction_count() :: non_neg_integer()
  def active_restriction_count do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.one(
      from r in UserRestriction,
        where: r.active == true,
        where: is_nil(r.expires_at) or r.expires_at > ^now,
        select: count(r.id)
    ) || 0
  end

  # ---------------------------------------------------------------------------
  # Extended Stats — Reports by Category
  # ---------------------------------------------------------------------------

  @doc """
  Get report counts grouped by category over a time period.
  """
  @spec reports_by_category(non_neg_integer()) :: map()
  def reports_by_category(days \\ 30) do
    cutoff = DateTime.utc_now() |> DateTime.add(-days * 86_400, :second)

    Report
    |> where([r], r.inserted_at >= ^cutoff)
    |> group_by([r], r.category)
    |> select([r], {r.category, count(r.id)})
    |> Repo.all()
    |> Map.new(fn {cat, count} -> {to_string(cat), count} end)
  end

  @doc """
  Get report trend data over time (daily counts).
  """
  @spec reports_trend(non_neg_integer()) :: [map()]
  def reports_trend(days \\ 30) do
    cutoff = DateTime.utc_now() |> DateTime.add(-days * 86_400, :second)

    Report
    |> where([r], r.inserted_at >= ^cutoff)
    |> group_by([r], fragment("date_trunc('day', ?)", r.inserted_at))
    |> select([r], %{
      date: fragment("date_trunc('day', ?)", r.inserted_at),
      count: count(r.id)
    })
    |> order_by([r], fragment("date_trunc('day', ?)", r.inserted_at))
    |> Repo.all()
  end

  # ---------------------------------------------------------------------------
  # Extended Stats — Resolution Rate
  # ---------------------------------------------------------------------------

  @doc """
  Get the percentage of reports that have been resolved or dismissed.
  """
  @spec resolution_rate() :: float()
  def resolution_rate do
    total = Repo.aggregate(Report, :count)
    resolved = Report |> where([r], r.status in [:resolved, :dismissed]) |> Repo.aggregate(:count)

    if total > 0, do: Float.round(resolved / total * 100, 1), else: 0.0
  end

  # ---------------------------------------------------------------------------
  # Extended Stats — Moderator Leaderboard
  # ---------------------------------------------------------------------------

  @doc """
  Get top moderators by action count in the last N days.
  """
  @spec moderator_leaderboard(non_neg_integer()) :: [map()]
  def moderator_leaderboard(limit \\ 10) do
    cutoff = DateTime.utc_now() |> DateTime.add(-30 * 86_400, :second)

    ReviewAction
    |> where([ra], ra.inserted_at >= ^cutoff)
    |> group_by([ra], ra.reviewer_id)
    |> select([ra], %{
      reviewer_id: ra.reviewer_id,
      actions_count: count(ra.id),
      last_action: max(ra.inserted_at)
    })
    |> order_by([ra], desc: count(ra.id))
    |> limit(^limit)
    |> Repo.all()
    |> Enum.map(&load_reviewer/1)
  end

  # ---------------------------------------------------------------------------
  # Extended Stats — AI Auto-Action
  # ---------------------------------------------------------------------------

  @doc """
  Get AI auto-action statistics: decisions grouped by action and auto-actioned flag.
  """
  @spec ai_auto_action_stats(non_neg_integer()) :: [map()]
  def ai_auto_action_stats(days \\ 30) do
    cutoff = DateTime.utc_now() |> DateTime.add(-days * 86_400, :second)

    AuditLog
    |> where([l], l.inserted_at >= ^cutoff and not is_nil(l.ai_action))
    |> group_by([l], [l.ai_action, l.auto_actioned])
    |> select([l], %{
      ai_action: l.ai_action,
      auto_actioned: l.auto_actioned,
      count: count(l.id)
    })
    |> Repo.all()
  end

  # ---------------------------------------------------------------------------
  # Extended Stats — Appeals
  # ---------------------------------------------------------------------------

  @doc """
  Get appeals outcome distribution: counts grouped by status.
  """
  @spec appeals_outcome_stats(non_neg_integer()) :: map()
  def appeals_outcome_stats(days \\ 30) do
    cutoff = DateTime.utc_now() |> DateTime.add(-days * 86_400, :second)

    Appeal
    |> where([a], a.inserted_at >= ^cutoff)
    |> group_by([a], a.status)
    |> select([a], {a.status, count(a.id)})
    |> Repo.all()
    |> Map.new(fn {status, count} -> {to_string(status), count} end)
  end

  # ---------------------------------------------------------------------------
  # Comprehensive Stats
  # ---------------------------------------------------------------------------

  @doc """
  Get all moderation stats in a single call for the admin dashboard.
  """
  @spec comprehensive_stats(non_neg_integer()) :: map()
  def comprehensive_stats(days \\ 30) do
    %{
      reports_today: reports_reviewed_today(),
      avg_response_time: average_response_time(),
      active_restrictions: active_restriction_count(),
      reports_by_category: reports_by_category(days),
      reports_trend: reports_trend(days),
      resolution_rate: resolution_rate(),
      moderator_leaderboard: moderator_leaderboard(),
      ai_stats: ai_auto_action_stats(days),
      appeals_stats: appeals_outcome_stats(days)
    }
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp load_reviewer(%{reviewer_id: id} = entry) do
    case Repo.get(CGraph.Accounts.User, id) do
      nil ->
        Map.merge(entry, %{username: "unknown", display_name: "Unknown"})

      user ->
        Map.merge(entry, %{
          username: user.username,
          display_name: user.display_name || user.username
        })
    end
  end
end
