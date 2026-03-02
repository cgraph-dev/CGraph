defmodule CGraph.Creators.Earnings do
  @moduledoc """
  Tracks creator earnings from paid forum subscriptions.

  Each payment event creates a ledger row showing:
  - gross_amount_cents: total charged to subscriber
  - platform_fee_cents: CGraph's cut
  - net_amount_cents: creator's take

  Also provides balance calculation and analytics aggregation.
  """

  import Ecto.Query
  require Logger

  alias CGraph.Creators.{CreatorEarning, CreatorPayout, PaidForumSubscription, PaidSubscription}
  alias CGraph.Repo

  @doc """
  Records a single earning entry from a subscriber payment.

  Automatically calculates platform fee and net based on the configured
  `platform_fee_percent`.
  """
  @spec record_earning(String.t(), map()) :: {:ok, CreatorEarning.t()} | {:error, any()}
  def record_earning(creator_id, params) do
    gross = params.amount_cents
    fee_percent = PaidSubscription.platform_fee_percent()
    platform_fee = div(gross * fee_percent, 100)
    net = gross - platform_fee

    %CreatorEarning{}
    |> CreatorEarning.changeset(%{
      creator_id: creator_id,
      forum_id: Map.get(params, :forum_id),
      subscriber_id: Map.get(params, :subscriber_id),
      paid_forum_subscription_id: Map.get(params, :paid_forum_subscription_id),
      gross_amount_cents: gross,
      platform_fee_cents: platform_fee,
      net_amount_cents: net,
      currency: Map.get(params, :currency, "usd"),
      stripe_payment_intent_id: Map.get(params, :payment_intent_id),
      period_start: Map.get(params, :period_start),
      period_end: Map.get(params, :period_end)
    })
    |> Repo.insert()
  end

  @doc """
  Calculates the creator's current balance.

  Balance = total net earnings - total completed payouts.
  """
  @spec get_balance(String.t()) :: map()
  def get_balance(creator_id) do
    total_earned =
      from(e in CreatorEarning,
        where: e.creator_id == ^creator_id,
        select: coalesce(sum(e.net_amount_cents), 0)
      )
      |> Repo.one()

    total_paid_out =
      from(p in CreatorPayout,
        where: p.creator_id == ^creator_id and p.status == "completed",
        select: coalesce(sum(p.amount_cents), 0)
      )
      |> Repo.one()

    %{
      total_earned_cents: total_earned,
      total_paid_out_cents: total_paid_out,
      available_balance_cents: total_earned - total_paid_out
    }
  end

  @doc """
  Returns analytics stats for a creator.

  Includes subscriber count, MRR, churn rate, earnings over time, and top forums.
  """
  @spec get_stats(String.t(), atom()) :: map()
  def get_stats(creator_id, period \\ :last_30_days) do
    now = DateTime.utc_now()
    period_start = period_start_date(now, period)

    subscriber_count = count_active_subscribers(creator_id)
    mrr_cents = calculate_mrr(creator_id)
    churn_rate = calculate_churn_rate(creator_id, period_start, now)
    earnings_over_time = earnings_by_month(creator_id)
    top_forums = top_forums_by_subscribers(creator_id)

    %{
      subscriber_count: subscriber_count,
      mrr_cents: mrr_cents,
      churn_rate: churn_rate,
      earnings_over_time: earnings_over_time,
      top_forums: top_forums
    }
  end

  @doc "Lists earnings for a creator, paginated."
  @spec list_earnings(String.t(), keyword()) :: [CreatorEarning.t()]
  def list_earnings(creator_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)

    from(e in CreatorEarning,
      where: e.creator_id == ^creator_id,
      order_by: [desc: e.inserted_at],
      limit: ^limit,
      offset: ^offset,
      preload: [:forum, :subscriber]
    )
    |> Repo.all()
  end

  # ── Private aggregation helpers ─────────────────────────────────

  defp count_active_subscribers(creator_id) do
    now = DateTime.utc_now()

    from(s in PaidForumSubscription,
      where: s.creator_id == ^creator_id
        and s.status in ["active", "canceled"]
        and s.current_period_end > ^now,
      select: count(s.id)
    )
    |> Repo.one()
  end

  defp calculate_mrr(creator_id) do
    now = DateTime.utc_now()

    from(s in PaidForumSubscription,
      where: s.creator_id == ^creator_id
        and s.status == "active"
        and s.current_period_end > ^now,
      select: coalesce(sum(s.price_cents), 0)
    )
    |> Repo.one()
  end

  defp calculate_churn_rate(creator_id, period_start, _now) do
    canceled =
      from(s in PaidForumSubscription,
        where: s.creator_id == ^creator_id
          and s.status in ["canceled", "expired"]
          and s.canceled_at >= ^period_start,
        select: count(s.id)
      )
      |> Repo.one()

    total =
      from(s in PaidForumSubscription,
        where: s.creator_id == ^creator_id
          and s.inserted_at >= ^period_start,
        select: count(s.id)
      )
      |> Repo.one()

    if total > 0, do: Float.round(canceled / total * 100, 1), else: 0.0
  end

  defp earnings_by_month(creator_id) do
    from(e in CreatorEarning,
      where: e.creator_id == ^creator_id,
      group_by: fragment("date_trunc('month', ?)", e.inserted_at),
      select: %{
        month: fragment("date_trunc('month', ?)::date", e.inserted_at),
        net_cents: sum(e.net_amount_cents)
      },
      order_by: fragment("date_trunc('month', ?)", e.inserted_at)
    )
    |> Repo.all()
  end

  defp top_forums_by_subscribers(creator_id) do
    now = DateTime.utc_now()

    from(s in PaidForumSubscription,
      where: s.creator_id == ^creator_id
        and s.status in ["active", "canceled"]
        and s.current_period_end > ^now,
      join: f in assoc(s, :forum),
      group_by: [f.id, f.name],
      select: %{
        forum_id: f.id,
        name: f.name,
        subscribers: count(s.id),
        mrr_cents: sum(s.price_cents)
      },
      order_by: [desc: count(s.id)],
      limit: 10
    )
    |> Repo.all()
  end

  defp period_start_date(now, :last_7_days), do: DateTime.add(now, -7 * 86_400, :second)
  defp period_start_date(now, :last_30_days), do: DateTime.add(now, -30 * 86_400, :second)
  defp period_start_date(now, :last_90_days), do: DateTime.add(now, -90 * 86_400, :second)
  defp period_start_date(now, _), do: DateTime.add(now, -30 * 86_400, :second)
end
