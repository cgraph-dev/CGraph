defmodule CGraph.Creators do
  @moduledoc """
  Creator monetization context — facade for Connect onboarding,
  paid subscriptions, earnings, and payouts.

  Delegates to specialized sub-modules while keeping the public API clean.
  """

  alias CGraph.Creators.{ConnectOnboarding, PaidSubscription, Earnings, Payout}

  # ── Connect Onboarding ──────────────────────────────────────────

  defdelegate create_connect_account(user), to: ConnectOnboarding
  defdelegate create_account_link(connect_account_id), to: ConnectOnboarding
  defdelegate check_account_status(connect_account_id), to: ConnectOnboarding
  defdelegate handle_account_updated(connect_account_id, status), to: ConnectOnboarding

  # ── Paid Subscriptions ──────────────────────────────────────────

  defdelegate subscribe_to_paid_forum(subscriber, forum), to: PaidSubscription
  defdelegate cancel_paid_subscription(subscription), to: PaidSubscription
  defdelegate has_active_subscription?(user_id, forum_id), to: PaidSubscription
  defdelegate list_forum_subscribers(forum_id), to: PaidSubscription
  defdelegate update_subscription_status(stripe_sub_id, attrs), to: PaidSubscription
  defdelegate platform_fee_percent(), to: PaidSubscription

  # ── Earnings ────────────────────────────────────────────────────

  defdelegate record_earning(creator_id, params), to: Earnings
  defdelegate get_balance(creator_id), to: Earnings
  defdelegate get_stats(creator_id, period \\ :last_30_days), to: Earnings
  defdelegate list_earnings(creator_id, opts \\ []), to: Earnings

  # ── Payouts ─────────────────────────────────────────────────────

  defdelegate request_payout(creator), to: Payout
  defdelegate update_payout_status(stripe_transfer_id, status, extra \\ %{}), to: Payout
  defdelegate list_payouts(creator_id, opts \\ []), to: Payout
  defdelegate minimum_payout_cents(), to: Payout
end
