defmodule CGraph.Creators.PremiumContent do
  @moduledoc """
  Sub-module for premium content operations.

  Handles creation and purchase of premium threads,
  subscription tier management, and revenue split calculations.
  """

  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.Creators.{PremiumThread, SubscriptionTier, RevenueSplit}

  @default_creator_share Decimal.new("0.80")
  @default_platform_share Decimal.new("0.20")
  @default_referral_share Decimal.new("0.00")

  # ── Premium Threads ─────────────────────────────────────────────

  @doc "Mark a thread as premium content with a Node price."
  def create_premium_thread(creator_id, thread_id, attrs) do
    %PremiumThread{}
    |> PremiumThread.changeset(
      Map.merge(attrs, %{creator_id: creator_id, thread_id: thread_id})
    )
    |> Repo.insert()
  end

  @doc "Purchase access to a premium thread using Nodes."
  def purchase_thread_access(user_id, thread_id, opts \\ %{}) do
    case Repo.get_by(PremiumThread, thread_id: thread_id) do
      nil ->
        {:error, :not_premium}

      premium_thread ->
        # Enqueue the revenue split worker for async processing
        %{
          user_id: user_id,
          thread_id: thread_id,
          premium_thread_id: premium_thread.id,
          creator_id: premium_thread.creator_id,
          price_nodes: premium_thread.price_nodes,
          referral_id: Map.get(opts, :referral_id)
        }
        |> CGraph.Workers.RevenueSplitWorker.new()
        |> Oban.insert()

        {:ok, %{thread_id: thread_id, price_nodes: premium_thread.price_nodes}}
    end
  end

  # ── Subscription Tiers ──────────────────────────────────────────

  @doc "Create a new subscription tier for a creator within a forum."
  def create_subscription_tier(creator_id, forum_id, attrs) do
    %SubscriptionTier{}
    |> SubscriptionTier.changeset(
      Map.merge(attrs, %{creator_id: creator_id, forum_id: forum_id})
    )
    |> Repo.insert()
  end

  @doc "Subscribe a user to a creator's subscription tier."
  def subscribe_to_tier(user_id, tier_id, opts \\ %{}) do
    case Repo.get(SubscriptionTier, tier_id) do
      nil ->
        {:error, :tier_not_found}

      %SubscriptionTier{active: false} ->
        {:error, :tier_inactive}

      tier ->
        # Check max_subscribers if set
        if tier.max_subscribers do
          current_count = count_tier_subscribers(tier_id)

          if current_count >= tier.max_subscribers do
            {:error, :tier_full}
          else
            do_subscribe_to_tier(user_id, tier, opts)
          end
        else
          do_subscribe_to_tier(user_id, tier, opts)
        end
    end
  end

  @doc "List all subscription tiers for a creator."
  def list_creator_tiers(creator_id) do
    SubscriptionTier
    |> where([t], t.creator_id == ^creator_id)
    |> order_by([t], asc: t.price_monthly_nodes)
    |> Repo.all()
  end

  # ── Revenue Splits ─────────────────────────────────────────────

  @doc """
  Calculate the revenue split for a thread purchase.

  Returns the split configuration for the thread, or creates a default
  80/20 creator/platform split if none exists.
  """
  def calculate_revenue_split(thread_id, amount) do
    split =
      case Repo.get_by(RevenueSplit, thread_id: thread_id) do
        nil ->
          %{
            creator_share: @default_creator_share,
            platform_share: @default_platform_share,
            referral_share: @default_referral_share
          }

        existing ->
          %{
            creator_share: existing.creator_share,
            platform_share: existing.platform_share,
            referral_share: existing.referral_share
          }
      end

    amount_dec = Decimal.new(amount)

    {:ok,
     %{
       creator_amount: Decimal.mult(amount_dec, split.creator_share),
       platform_amount: Decimal.mult(amount_dec, split.platform_share),
       referral_amount: Decimal.mult(amount_dec, split.referral_share),
       split: split
     }}
  end

  # ── Private ─────────────────────────────────────────────────────

  defp do_subscribe_to_tier(user_id, tier, _opts) do
    # Record the tier subscription — for now return a success tuple
    # Full payment integration will be wired in follow-up plans
    {:ok,
     %{
       user_id: user_id,
       tier_id: tier.id,
       tier_name: tier.name,
       price_monthly_nodes: tier.price_monthly_nodes
     }}
  end

  defp count_tier_subscribers(_tier_id) do
    # Placeholder — will query actual subscription records in follow-up
    0
  end
end
