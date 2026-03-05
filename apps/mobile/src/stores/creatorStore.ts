/**
 * Mobile Creator Store
 *
 * Zustand store for creator monetization state on mobile.
 * Handles creator status, balance, payouts, and basic analytics.
 *
 * @module stores/creatorStore
 * @since v1.0.0
 */

import { create } from 'zustand';
import {
  getCreatorStatus,
  getBalance,
  requestPayout as requestPayoutApi,
  listPayouts,
  getAnalyticsOverview,
  onboard as onboardApi,
  refreshOnboard as refreshOnboardApi,
  type CreatorStatus,
  type CreatorBalance,
  type PayoutRequest,
  type AnalyticsOverview,
} from '../services/creatorService';

// ── Store Interface ────────────────────────────────────────────────────

interface CreatorState {
  // Status
  isCreator: boolean;
  onboardingComplete: boolean;
  creatorStatus: 'none' | 'pending' | 'active' | 'suspended';

  // Balance
  balance: CreatorBalance | null;

  // Payouts
  payouts: PayoutRequest[];

  // Analytics
  analyticsOverview: AnalyticsOverview | null;

  // Loading
  isLoading: boolean;
  isLoadingBalance: boolean;
  isLoadingPayouts: boolean;
  error: string | null;

  // Actions
  fetchStatus: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  requestPayout: (amount?: number) => Promise<PayoutRequest | null>;
  fetchPayouts: (page?: number) => Promise<void>;
  fetchAnalyticsOverview: (params?: { period?: string }) => Promise<void>;
  onboard: () => Promise<{ url: string } | null>;
  refreshOnboard: () => Promise<{ url: string } | null>;
  reset: () => void;
}

// ── Initial State ──────────────────────────────────────────────────────

const initialState = {
  isCreator: false,
  onboardingComplete: false,
  creatorStatus: 'none' as const,
  balance: null,
  payouts: [],
  analyticsOverview: null,
  isLoading: false,
  isLoadingBalance: false,
  isLoadingPayouts: false,
  error: null,
};

// ── Store ──────────────────────────────────────────────────────────────

export const useCreatorStore = create<CreatorState>()((set) => ({
  ...initialState,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getCreatorStatus();
      set({
        isCreator: data.creatorStatus === 'active',
        onboardingComplete: data.onboardingComplete,
        creatorStatus: data.creatorStatus ?? 'none',
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, error: 'Failed to fetch creator status' });
    }
  },

  fetchBalance: async () => {
    set({ isLoadingBalance: true });
    try {
      const data = await getBalance();
      set({ balance: data, isLoadingBalance: false });
    } catch {
      set({ isLoadingBalance: false });
    }
  },

  requestPayout: async (amount?: number): Promise<PayoutRequest | null> => {
    set({ isLoading: true, error: null });
    try {
      const data = await requestPayoutApi(amount);
      // Refresh balance and payouts
      getBalance().then((b) => set({ balance: b })).catch(() => {});
      listPayouts().then((p) => set({ payouts: p })).catch(() => {});
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
      const data = await listPayouts(page);
      set({ payouts: data, isLoadingPayouts: false });
    } catch {
      set({ isLoadingPayouts: false });
    }
  },

  fetchAnalyticsOverview: async (params) => {
    set({ isLoading: true });
    try {
      const data = await getAnalyticsOverview(params);
      set({ analyticsOverview: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  onboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await onboardApi();
      set({ isLoading: false });
      return { url: data?.onboarding_url || data?.url };
    } catch {
      set({ isLoading: false, error: 'Failed to start onboarding' });
      return null;
    }
  },

  refreshOnboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await refreshOnboardApi();
      set({ isLoading: false });
      return { url: data?.onboarding_url || data?.url };
    } catch {
      set({ isLoading: false, error: 'Failed to refresh onboarding link' });
      return null;
    }
  },

  reset: () => set(initialState),
}));

// ── Selector Hooks ─────────────────────────────────────────────────────

export const useIsCreator = () => useCreatorStore((s) => s.isCreator);
export const useCreatorStatus = () => useCreatorStore((s) => s.creatorStatus);
export const useCreatorBalance = () => useCreatorStore((s) => s.balance);
export const useCreatorPayouts = () => useCreatorStore((s) => s.payouts);
