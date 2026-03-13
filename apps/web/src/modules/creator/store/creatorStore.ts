/**
 * Creator Store — Implementation
 *
 * Zustand store for creator monetization state.
 * Handles status, balance, payouts, and analytics.
 * Persists creator status to avoid flicker on page load.
 *
 * @module modules/creator/store/creatorStore
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { creatorService } from '../services/creatorService';
import type { CreatorState, PayoutRequest } from './creatorStore.types';

// Re-export types
export type {
  CreatorState,
  CreatorStatus,
  CreatorBalance,
  PayoutRequest,
  AnalyticsOverview,
  EarningsData,
  SubscriberAnalytics,
  ContentAnalytics,
} from './creatorStore.types';

// ── Initial state (shared between init and reset) ──────────────────────

const initialState = {
  isCreator: false,
  onboardingComplete: false,
  creatorStatus: 'none' as const,
  stripeAccountId: null,
  balance: null,
  payouts: [],
  analyticsOverview: null,
  earningsData: null,
  subscriberAnalytics: null,
  contentAnalytics: null,
  isLoading: false,
  isLoadingBalance: false,
  isLoadingPayouts: false,
  isLoadingAnalytics: false,
  error: null,
  premiumThreads: [] as any[],
  tiers: [] as any[],
  isLoadingPremium: false,
};

// ── Store ──────────────────────────────────────────────────────────────

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set) => ({
      ...initialState,

      fetchStatus: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorService.getStatus();
          set({
            isCreator: data.creatorStatus === 'active',
            onboardingComplete: data.onboardingComplete,
            creatorStatus: data.creatorStatus ?? 'none',
            stripeAccountId: data.stripeAccountId ?? null,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false, error: 'Failed to fetch creator status' });
        }
      },

      fetchBalance: async () => {
        set({ isLoadingBalance: true });
        try {
          const data = await creatorService.getBalance();
          set({ balance: data, isLoadingBalance: false });
        } catch {
          set({ isLoadingBalance: false });
        }
      },

      requestPayout: async (amount?: number): Promise<PayoutRequest | null> => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorService.requestPayout(amount);
          // Refresh balance and payouts after payout request
          creatorService.getBalance().then((b) => set({ balance: b })).catch(() => {});
          creatorService.listPayouts().then((p) => set({ payouts: p })).catch(() => {});
          set({ isLoading: false });
          return data;
        } catch {
          set({ isLoading: false, error: 'Failed to request payout' });
          return null;
        }
      },

      fetchPayouts: async (page = 1) => {
        set({ isLoadingPayouts: true });
        try {
          const data = await creatorService.listPayouts(page);
          set({ payouts: data, isLoadingPayouts: false });
        } catch {
          set({ isLoadingPayouts: false });
        }
      },

      fetchAnalyticsOverview: async (params) => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsOverview(params);
          set({ analyticsOverview: data, isLoadingAnalytics: false });
        } catch {
          set({ isLoadingAnalytics: false });
        }
      },

      fetchAnalyticsEarnings: async (params) => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsEarnings(params);
          set({ earningsData: data, isLoadingAnalytics: false });
        } catch {
          set({ isLoadingAnalytics: false });
        }
      },

      fetchAnalyticsSubscribers: async () => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsSubscribers();
          set({ subscriberAnalytics: data, isLoadingAnalytics: false });
        } catch {
          set({ isLoadingAnalytics: false });
        }
      },

      fetchAnalyticsContent: async () => {
        set({ isLoadingAnalytics: true });
        try {
          const data = await creatorService.getAnalyticsContent();
          set({ contentAnalytics: data, isLoadingAnalytics: false });
        } catch {
          set({ isLoadingAnalytics: false });
        }
      },

      onboard: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorService.onboard();
          set({ isLoading: false });
          return { url: data.onboarding_url || data.url };
        } catch {
          set({ isLoading: false, error: 'Failed to start onboarding' });
          return null;
        }
      },

      refreshOnboard: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorService.refreshOnboard();
          set({ isLoading: false });
          return { url: data.onboarding_url || data.url };
        } catch {
          set({ isLoading: false, error: 'Failed to refresh onboarding link' });
          return null;
        }
      },

      fetchPremiumThreads: async () => {
        set({ isLoadingPremium: true });
        try {
          const data = await creatorService.listPremiumThreads();
          set({ premiumThreads: data, isLoadingPremium: false });
        } catch {
          set({ isLoadingPremium: false });
        }
      },
      fetchTiers: async () => {
        try {
          const data = await creatorService.listTiers();
          set({ tiers: data });
        } catch {
          // Tier fetch failures are non-critical — cached data remains
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'cgraph-creator',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        isCreator: state.isCreator,
        onboardingComplete: state.onboardingComplete,
        creatorStatus: state.creatorStatus,
      }),
    },
  ),
);
