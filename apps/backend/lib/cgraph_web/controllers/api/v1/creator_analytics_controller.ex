defmodule CGraphWeb.API.V1.CreatorAnalyticsController do
  @moduledoc """
  Creator analytics endpoints.

  Provides overview stats, earnings over time, subscriber lists,
  and top content analytics for the creator dashboard.
  """

  use CGraphWeb, :controller

  alias CGraph.Creators
  alias CGraph.Creators.PaidSubscription

  @doc "GET /api/v1/creator/analytics/overview — Subscriber count, MRR, churn."
  def overview(conn, params) do
    user = conn.assigns.current_user
    period = parse_period(params["period"])
    stats = Creators.get_stats(user.id, period)

    json(conn, %{data: %{
      subscriber_count: stats.subscriber_count,
      mrr_cents: stats.mrr_cents,
      churn_rate: stats.churn_rate,
      platform_fee_percent: PaidSubscription.platform_fee_percent()
    }})
  end

  @doc "GET /api/v1/creator/analytics/earnings — Earnings over time."
  def earnings(conn, params) do
    user = conn.assigns.current_user
    period = parse_period(params["period"])
    stats = Creators.get_stats(user.id, period)

    json(conn, %{data: %{
      earnings_over_time: stats.earnings_over_time,
      top_forums: stats.top_forums
    }})
  end

  @doc "GET /api/v1/creator/analytics/subscribers — Subscriber list."
  def subscribers(conn, %{"forum_id" => forum_id}) do
    subs = Creators.list_forum_subscribers(forum_id)

    json(conn, %{data: Enum.map(subs, fn s ->
      %{
        id: s.id,
        subscriber_id: s.subscriber_id,
        subscriber_name: s.subscriber && s.subscriber.username,
        status: s.status,
        price_cents: s.price_cents,
        current_period_end: s.current_period_end,
        inserted_at: s.inserted_at
      }
    end)})
  end

  def subscribers(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: %{message: "forum_id is required"}})
  end

  @doc "GET /api/v1/creator/analytics/content — Top content by engagement."
  def content(conn, _params) do
    user = conn.assigns.current_user
    stats = Creators.get_stats(user.id, :last_30_days)

    json(conn, %{data: %{
      top_forums: stats.top_forums
    }})
  end

  # ── Private ──────────────────────────────────────────────────────

  defp parse_period("7d"), do: :last_7_days
  defp parse_period("30d"), do: :last_30_days
  defp parse_period("90d"), do: :last_90_days
  defp parse_period(_), do: :last_30_days
end
