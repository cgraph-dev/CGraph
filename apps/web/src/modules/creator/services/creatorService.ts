/**
 * Creator Monetization Service
 *
 * API client methods for creator onboarding, earnings, payouts,
 * subscriptions, and analytics. Uses the shared axios-based API client.
 *
 * @module modules/creator/services/creatorService
 */

import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

export interface CreatorStatus {
  isCreator: boolean;
  onboardingComplete: boolean;
  creatorStatus: 'none' | 'pending' | 'active' | 'suspended';
  stripeAccountId?: string;
  onboardedAt?: string | null;
}

export interface CreatorBalance {
  available: number;
  pending: number;
  currency: string;
  totalEarnedCents: number;
  totalPaidOutCents: number;
  availableBalanceCents: number;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  amountCents: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currency: string;
  requestedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  subscriberCount: number;
  mrrCents: number;
  churnRate: number;
  platformFeePercent: number;
}

export interface EarningsData {
  earningsOverTime: { month: string; netCents: number }[];
  topForums: { forumId: string; name: string; subscribers: number; mrrCents: number }[];
}

export interface SubscriberAnalytics {
  totalSubscribers: number;
  newSubscribers: number;
  churned: number;
  netGrowth: number;
}

export interface ContentAnalytics {
  totalPosts: number;
  topPosts: { id: string; title: string; views: number; engagement: number }[];
}

// ── Service ────────────────────────────────────────────────────────────

export const creatorService = {
  /** Start Stripe Connect onboarding */
  async onboard() {
    const response = await api.post<{ data: { url: string; onboarding_url: string } }>(
      '/api/v1/creator/onboard'
    );
    return response.data.data;
  },

  /** Get current creator status */
  async getStatus() {
    const response = await api.get<{ data: CreatorStatus }>('/api/v1/creator/status');
    return response.data.data;
  },

  /** Generate a new onboarding link */
  async refreshOnboard() {
    const response = await api.post<{ data: { url: string; onboarding_url: string } }>(
      '/api/v1/creator/onboard/refresh'
    );
    return response.data.data;
  },

  /** Get earnings balance */
  async getBalance() {
    const response = await api.get<{ data: CreatorBalance }>('/api/v1/creator/balance');
    return response.data.data;
  },

  /** Request a payout ($10 minimum) */
  async requestPayout(amount?: number) {
    const response = await api.post<{ data: PayoutRequest }>('/api/v1/creator/payout', {
      amount,
    });
    return response.data.data;
  },

  /** List past payouts (paginated) */
  async listPayouts(page = 1) {
    const response = await api.get<{ data: PayoutRequest[] }>('/api/v1/creator/payouts', {
      params: { page },
    });
    return response.data.data;
  },

  /** Get overview analytics */
  async getAnalyticsOverview(params?: { period?: string; start?: string; end?: string }) {
    const response = await api.get<{ data: AnalyticsOverview }>(
      '/api/v1/creator/analytics/overview',
      { params }
    );
    return response.data.data;
  },

  /** Get earnings analytics */
  async getAnalyticsEarnings(params?: { period?: string; start?: string; end?: string }) {
    const response = await api.get<{ data: EarningsData }>('/api/v1/creator/analytics/earnings', {
      params,
    });
    return response.data.data;
  },

  /** Get subscriber analytics */
  async getAnalyticsSubscribers() {
    const response = await api.get<{ data: SubscriberAnalytics }>(
      '/api/v1/creator/analytics/subscribers'
    );
    return response.data.data;
  },

  /** Get content analytics */
  async getAnalyticsContent() {
    const response = await api.get<{ data: ContentAnalytics }>('/api/v1/creator/analytics/content');
    return response.data.data;
  },

  /** Subscribe to a paid forum */
  async subscribe(forumId: string) {
    const response = await api.post(`/api/v1/forums/${forumId}/subscribe`);
    return response.data.data;
  },

  /** Unsubscribe from a paid forum */
  async unsubscribe(forumId: string) {
    const response = await api.delete(`/api/v1/forums/${forumId}/subscribe`);
    return response.data.data;
  },

  /** Update forum monetization settings */
  async updateMonetization(forumId: string, settings: Record<string, unknown>) {
    const response = await api.put(`/api/v1/forums/${forumId}/monetization`, settings);
    return response.data.data;
  },

  // ── Premium Content ──────────────────────────────────────────
  async listPremiumThreads() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<{ data: any[] }>('/api/v1/creator/premium-threads');
    return response.data.data;
  },
  async createPremiumThread(attrs: {
    threadId: string;
    priceNodes: number;
    subscriberOnly?: boolean;
    previewLength?: number;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.post<{ data: any }>('/api/v1/creator/premium-threads', attrs);
    return response.data.data;
  },
  async listTiers() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<{ data: any[] }>('/api/v1/creator/tiers');
    return response.data.data;
  },
  async createTier(attrs: {
    forumId: string;
    name: string;
    priceMonthlyNodes: number;
    benefits?: Record<string, boolean>;
    maxSubscribers?: number;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.post<{ data: any }>('/api/v1/creator/tiers', attrs);
    return response.data.data;
  },
  async purchaseThreadAccess(threadId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.put<{ data: any }>(`/api/v1/threads/${threadId}/purchase`);
    return response.data.data;
  },
};
