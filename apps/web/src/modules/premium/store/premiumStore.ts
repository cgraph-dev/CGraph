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

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt: string;
  pdfUrl: string | null;
}

export interface TierFeatures {
  xpMultiplier: number;
  coinBonus: number;
  customThemes: boolean;
  exclusiveBadges: boolean;
  exclusiveEffects: boolean;
  prioritySupport: boolean;
  dailyLimits: boolean;
  maxFileSizeMb: number;
  maxGroupsOwned: number;
  customBanner: boolean;
}

export interface PremiumState {
  // Subscription
  isSubscribed: boolean;
  currentTier: SubscriptionTier | null;
  subscribedAt: string | null;
  expiresAt: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none';
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  features: TierFeatures | null;

  // Coins
  coinBalance: number;

  // Purchase history
  purchaseHistory: PurchaseHistory[];

  // Invoices
  invoices: Invoice[];

  // Portal
  portalUrl: string | null;

  // Loading
  isLoading: boolean;

  // Actions
  fetchBillingStatus: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  setSubscription: (tier: SubscriptionTier, expiresAt: string) => void;
  cancelSubscription: () => void;
  openBillingPortal: () => Promise<void>;
  subscribe: (tier: SubscriptionTier) => Promise<void>;
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
      cancelAtPeriodEnd: false,
      graceUntil: null,
      features: null,
      coinBalance: 0,
      purchaseHistory: [],
      invoices: [],
      portalUrl: null,
      isLoading: false,

      // Sync from backend billing API
      fetchBillingStatus: async () => {
        set({ isLoading: true });
        try {
          const billing = await billingService.getStatus();
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const tier = (billing.tier === 'free' ? null : billing.tier) as SubscriptionTier | null;
          set({
            isSubscribed: billing.status === 'active' || billing.status === 'trialing',
            currentTier: tier,
            expiresAt: billing.currentPeriodEnd,
            status: billing.status,
            cancelAtPeriodEnd: billing.cancelAtPeriodEnd ?? false,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
        }
      },

      // Fetch invoice history
      fetchInvoices: async () => {
        try {
          const invoices = await billingService.getInvoices();
          set({ invoices });
        } catch {
          // Silently fail — invoices are non-critical
        }
      },

      // Subscribe to a tier via Stripe Checkout redirect
      subscribe: async (tier: SubscriptionTier) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
        await billingService.redirectToCheckout(tier as any);
      },

      // Open Stripe Billing Portal
      openBillingPortal: async () => {
        await billingService.redirectToPortal();
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
          cancelAtPeriodEnd: false,
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
      reset: () =>
        set({
          isSubscribed: false,
          currentTier: null,
          subscribedAt: null,
          expiresAt: null,
          status: 'none',
          cancelAtPeriodEnd: false,
          graceUntil: null,
          features: null,
          coinBalance: 0,
          purchaseHistory: [],
          invoices: [],
          portalUrl: null,
          isLoading: false,
        }),
    }),
    {
      name: 'cgraph-premium',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
