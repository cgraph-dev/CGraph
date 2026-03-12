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
    # Single query with subqueries ensures consistent point-in-time snapshot
    result =
      from(e in CreatorEarning,
        where: e.creator_id == ^creator_id,
        select: %{
          total_earned_cents: coalesce(sum(e.net_amount_cents), 0),
          total_paid_out_cents:
            subquery(
              from(p in CreatorPayout,
                where: p.creator_id == ^creator_id and p.status == "completed",
                select: coalesce(sum(p.amount_cents), 0)
              )
            )
        }
      )
      |> Repo.one()

    case result do
      nil ->
        %{total_earned_cents: 0, total_paid_out_cents: 0, available_balance_cents: 0}

      %{total_earned_cents: earned, total_paid_out_cents: paid} ->
        %{
          total_earned_cents: earned,
          total_paid_out_cents: paid,
          available_balance_cents: earned - paid
        }
    end
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

  # ── GDPR Export ──────────────────────────────────────────────────────

  @doc """
  Export all earning records for a user (GDPR data export).
  Used by CGraph.DataExport.Processor.
  """
  @spec export_user_earnings(String.t()) :: {:ok, list(map())}
  def export_user_earnings(user_id) do
    earnings =
      from(e in CreatorEarning,
        where: e.creator_id == ^user_id,
        order_by: [desc: e.inserted_at]
      )
      |> Repo.all()
      |> Enum.map(fn e ->
        %{
          id: e.id,
          gross_amount_cents: e.gross_amount_cents,
          platform_fee_cents: e.platform_fee_cents,
          net_amount_cents: e.net_amount_cents,
          source_type: e.source_type,
          created_at: e.inserted_at
        }
      end)

    {:ok, earnings}
  end

  # ── Tax Reporting ────────────────────────────────────────────────────

  @doc """
  Calculate total net earnings for a creator in a given calendar year.
  Used by CGraph.Compliance.TaxReporter for 1099-K threshold checks.
  """
  @spec total_for_year(String.t(), integer()) :: {:ok, integer()}
  def total_for_year(creator_id, year) do
    year_start = DateTime.new!(Date.new!(year, 1, 1), ~T[00:00:00], "Etc/UTC")
    year_end = DateTime.new!(Date.new!(year + 1, 1, 1), ~T[00:00:00], "Etc/UTC")

    total =
      from(e in CreatorEarning,
        where:
          e.creator_id == ^creator_id and
            e.inserted_at >= ^year_start and
            e.inserted_at < ^year_end,
        select: coalesce(sum(e.net_amount_cents), 0)
      )
      |> Repo.one()

    {:ok, total}
  end
end
