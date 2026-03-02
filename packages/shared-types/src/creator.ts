/**
 * Creator Monetization Types
 *
 * Shared types for the creator monetization system:
 * - Stripe Connect onboarding
 * - Paid forum subscriptions
 * - Creator earnings & payouts
 * - Analytics dashboard
 * - Content gating
 */

// =============================================================================
// Creator Profile
// =============================================================================

/** Creator status as returned by the API. Never expose stripe_connect_id to clients. */
export interface CreatorProfile {
  is_creator: boolean;
  status: CreatorStatus;
  onboarded_at: string | null;
  /** True if a Stripe Connect account exists — ID is never sent to client */
  has_connect_account: boolean;
}

export type CreatorStatus = 'none' | 'pending' | 'active' | 'suspended';

// =============================================================================
// Paid Forum Configuration
// =============================================================================

export interface PaidForumConfig {
  monetization_enabled: boolean;
  subscription_price_cents: number;
  subscription_currency: string;
  subscriber_count: number;
}

// =============================================================================
// Paid Forum Subscription
// =============================================================================

export type PaidForumSubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired';

export interface PaidForumSubscription {
  id: string;
  forum_id: string;
  status: PaidForumSubscriptionStatus;
  price_cents: number;
  current_period_end: string;
}

// =============================================================================
// Creator Earnings
// =============================================================================

export interface CreatorEarning {
  id: string;
  forum_name: string;
  subscriber_name: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  period_start: string;
  period_end: string;
  inserted_at: string;
}

// =============================================================================
// Creator Balance
// =============================================================================

export interface CreatorBalance {
  total_earned_cents: number;
  total_paid_out_cents: number;
  available_balance_cents: number;
}

// =============================================================================
// Creator Payouts
// =============================================================================

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CreatorPayout {
  id: string;
  amount_cents: number;
  currency: string;
  status: PayoutStatus;
  requested_at: string;
  completed_at: string | null;
  failure_reason: string | null;
}

// =============================================================================
// Creator Analytics
// =============================================================================

export interface EarningMonth {
  month: string;
  net_cents: number;
}

export interface TopForum {
  forum_id: string;
  name: string;
  subscribers: number;
  mrr_cents: number;
}

export interface CreatorAnalytics {
  subscriber_count: number;
  mrr_cents: number;
  churn_rate: number;
  platform_fee_percent: number;
  earnings_over_time: EarningMonth[];
  top_forums: TopForum[];
}

// =============================================================================
// Content Gating
// =============================================================================

export interface ContentGate {
  gated: boolean;
  title: string;
  teaser: string | null;
  subscribe_url: string | null;
  price_display: string | null;
  forum_name: string;
}
