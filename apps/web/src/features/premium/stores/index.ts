/**
 * Premium Stores
 * 
 * Zustand stores for premium state management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubscriptionTier, CoinPackage, PurchaseHistory } from './types';

export interface PremiumState {
  // Subscription
  isSubscribed: boolean;
  currentTier: SubscriptionTier | null;
  subscribedAt: string | null;
  expiresAt: string | null;
  
  // Coins
  coinBalance: number;
  
  // Purchase history
  purchaseHistory: PurchaseHistory[];
  
  // Actions
  setSubscription: (tier: SubscriptionTier, expiresAt: string) => void;
  cancelSubscription: () => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addPurchase: (purchase: PurchaseHistory) => void;
  
  // Computed
  getRemainingDays: () => number | null;
  canAfford: (price: number) => boolean;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      // Initial state
      isSubscribed: false,
      currentTier: null,
      subscribedAt: null,
      expiresAt: null,
      coinBalance: 0,
      purchaseHistory: [],
      
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
        set((state) => ({
          purchaseHistory: [purchase, ...state.purchaseHistory],
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
    }),
    {
      name: 'cgraph-premium',
    }
  )
);
