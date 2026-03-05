/**
 * Creator Store — Type Definitions
 *
 * All interfaces and types used by the creator monetization store.
 *
 * @module modules/creator/store/creatorStore.types
 */

import type {
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  EarningsData,
  SubscriberAnalytics,
  ContentAnalytics,
} from '../services/creatorService';

// Re-export service types for convenience
export type {
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  EarningsData,
  SubscriberAnalytics,
  ContentAnalytics,
};

// ── Store State ────────────────────────────────────────────────────────

export interface CreatorState {
  // Status
  isCreator: boolean;
  onboardingComplete: boolean;
  creatorStatus: 'none' | 'pending' | 'active' | 'suspended';
  stripeAccountId: string | null;

  // Balance
  balance: {
    available: number;
    pending: number;
    currency: string;
    totalEarnedCents: number;
    totalPaidOutCents: number;
    availableBalanceCents: number;
  } | null;

  // Payouts
  payouts: PayoutRequest[];

  // Analytics
  analyticsOverview: AnalyticsOverview | null;
  earningsData: EarningsData | null;
  subscriberAnalytics: SubscriberAnalytics | null;
  contentAnalytics: ContentAnalytics | null;

  // Loading
  isLoading: boolean;
  isLoadingBalance: boolean;
  isLoadingPayouts: boolean;
  isLoadingAnalytics: boolean;
  error: string | null;

  // Actions
  fetchStatus: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  requestPayout: (amount?: number) => Promise<PayoutRequest | null>;
  fetchPayouts: (page?: number) => Promise<void>;
  fetchAnalyticsOverview: (params?: { period?: string }) => Promise<void>;
  fetchAnalyticsEarnings: (params?: { period?: string }) => Promise<void>;
  fetchAnalyticsSubscribers: () => Promise<void>;
  fetchAnalyticsContent: () => Promise<void>;
  onboard: () => Promise<{ url: string } | null>;
  refreshOnboard: () => Promise<{ url: string } | null>;
  reset: () => void;
}
