/**
 * Premium Stores
 *
 * Zustand stores for premium state management.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { billingService } from '@/services/billing';
import type { SubscriptionTier, PurchaseHistory } from './types';

export interface PremiumState {
  // Subscription
  isSubscribed: boolean;
  currentTier: SubscriptionTier | null;
  subscribedAt: string | null;
  expiresAt: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none';

  // Coins
  coinBalance: number;

  // Purchase history
  purchaseHistory: PurchaseHistory[];

  // Loading
  isLoading: boolean;

  // Actions
  fetchBillingStatus: () => Promise<void>;
  setSubscription: (tier: SubscriptionTier, expiresAt: string) => void;
  cancelSubscription: () => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addPurchase: (purchase: PurchaseHistory) => void;

  // Computed
  getRemainingDays: () => number | null;
  canAfford: (price: number) => boolean;
  reset: () => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSubscribed: false,
      currentTier: null,
      subscribedAt: null,
      expiresAt: null,
      status: 'none',
      coinBalance: 0,
      purchaseHistory: [],
      isLoading: false,

      // Sync from backend billing API
      fetchBillingStatus: async () => {
        set({ isLoading: true });
        try {
          const billing = await billingService.getStatus();
          const tier = (billing.tier === 'free' ? null : billing.tier) as SubscriptionTier | null;
          set({
            isSubscribed: billing.status === 'active' || billing.status === 'trialing',
            currentTier: tier,
            expiresAt: billing.currentPeriodEnd,
            status: billing.status,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      // Actions
      setSubscription: (tier, expiresAt) => {
        set({
          isSubscribed: true,
          currentTier: tier,
          subscribedAt: new Date().toISOString(),
          expiresAt,
        });
      },

      cancelSubscription: () => {
        set({
          isSubscribed: false,
          currentTier: null,
          subscribedAt: null,
          expiresAt: null,
        });
      },

      addCoins: (amount) => {
        set((state) => ({
          coinBalance: state.coinBalance + amount,
        }));
      },

      spendCoins: (amount) => {
        const state = get();
        if (state.coinBalance >= amount) {
          set({ coinBalance: state.coinBalance - amount });
          return true;
        }
        return false;
      },

      addPurchase: (purchase) => {
        const MAX_PURCHASE_HISTORY = 500;
        set((state) => ({
          purchaseHistory: [purchase, ...state.purchaseHistory].slice(0, MAX_PURCHASE_HISTORY),
        }));
      },

      // Computed
      getRemainingDays: () => {
        const state = get();
        if (!state.expiresAt) return null;
        const expires = new Date(state.expiresAt);
        const now = new Date();
        const diff = expires.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      },

      canAfford: (price) => {
        return get().coinBalance >= price;
      },
  reset: () => set({
    isSubscribed: false,
    currentTier: null,
    subscribedAt: null,
    expiresAt: null,
    status: 'none',
    coinBalance: 0,
    purchaseHistory: [],
    isLoading: false,
  }),
}),
    {
      name: 'cgraph-premium',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
