/**
 * usePremium Hook
 *
 * React hook for premium subscription and shop functionality.
 * Provides subscription status, coin balance, and shop features.
 *
 * @module hooks/usePremium
 * @since v0.9.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as premiumService from '../services/premiumService';
import {
  SubscriptionTier,
  UserSubscription,
  PremiumPerk,
  CoinBalance,
  CoinPackage,
  ShopItem,
  ShopCategory,
  CoinTransaction,
  PurchaseResult,
} from '../services/premiumService';

const CACHE_DURATION = 60000; // 1 minute

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface PremiumState {
  subscription: UserSubscription | null;
  tiers: SubscriptionTier[];
  perks: PremiumPerk[];
  coinBalance: CoinBalance | null;
  coinPackages: CoinPackage[];
  shopCategories: ShopCategory[];
  featuredItems: ShopItem[];
  inventory: ShopItem[];
  transactions: CoinTransaction[];
  isLoading: boolean;
  error: string | null;
}

interface UsePremiumOptions {
  autoLoad?: boolean;
}

interface UsePremiumReturn extends PremiumState {
  // Subscription functions
  refreshSubscription: () => Promise<void>;
  loadTiers: () => Promise<void>;
  subscribe: (
    tierId: string,
    paymentMethodId: string
  ) => Promise<{ clientSecret: string; subscriptionId: string } | null>;
  cancelSubscription: () => Promise<boolean>;
  resumeSubscription: () => Promise<boolean>;
  changeTier: (newTierId: string) => Promise<boolean>;
  loadPerks: () => Promise<void>;

  // Coin functions
  refreshCoinBalance: () => Promise<void>;
  loadCoinPackages: () => Promise<void>;
  purchaseCoins: (
    packageId: string,
    paymentMethodId: string
  ) => Promise<{ clientSecret: string } | null>;
  loadTransactions: () => Promise<void>;

  // Shop functions
  loadShopCategories: () => Promise<void>;
  loadCategoryItems: (categoryId: string) => Promise<ShopItem[]>;
  loadFeaturedItems: () => Promise<void>;
  purchaseItem: (itemId: string) => Promise<PurchaseResult | null>;
  equipItem: (itemId: string) => Promise<boolean>;
  unequipItem: (itemId: string) => Promise<boolean>;
  loadInventory: () => Promise<void>;
  giftItem: (itemId: string, recipientUsername: string, message?: string) => Promise<boolean>;

  // Computed values
  isPremium: boolean;
  premiumTier: string;
  coins: number;
  hasActiveSubscription: boolean;
}

/**
 *
 */
export function usePremium(options: UsePremiumOptions = {}): UsePremiumReturn {
  const { autoLoad = true } = options;

  const [state, setState] = useState<PremiumState>({
    subscription: null,
    tiers: [],
    perks: [],
    coinBalance: null,
    coinPackages: [],
    shopCategories: [],
    featuredItems: [],
    inventory: [],
    transactions: [],
    isLoading: false,
    error: null,
  });

  const cacheRef = useRef<{
    subscription?: CacheEntry<UserSubscription>;
    coinBalance?: CacheEntry<CoinBalance>;
    tiers?: CacheEntry<SubscriptionTier[]>;
  }>({});

  const isCacheValid = useCallback(<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }, []);

  // ==================== SUBSCRIPTION FUNCTIONS ====================

  const refreshSubscription = useCallback(async () => {
    if (isCacheValid(cacheRef.current.subscription)) {
      setState((prev) => ({ ...prev, subscription: cacheRef.current.subscription!.data ?? null }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscription = await premiumService.getUserSubscription();
      cacheRef.current.subscription = { data: subscription, timestamp: Date.now() };
      setState((prev) => ({ ...prev, subscription, isLoading: false }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load subscription',
      }));
    }
  }, [isCacheValid]);

  const loadTiers = useCallback(async () => {
    if (isCacheValid(cacheRef.current.tiers)) {
      setState((prev) => ({ ...prev, tiers: cacheRef.current.tiers!.data }));
      return;
    }

    try {
      const tiers = await premiumService.getSubscriptionTiers();
      cacheRef.current.tiers = { data: tiers, timestamp: Date.now() };
      setState((prev) => ({ ...prev, tiers }));
    } catch (error) {
      console.error('Failed to load tiers:', error);
    }
  }, [isCacheValid]);

  const subscribe = useCallback(
    async (
      tierId: string,
      paymentMethodId: string
    ): Promise<{ clientSecret: string; subscriptionId: string } | null> => {
      try {
        return await premiumService.subscribe(tierId, paymentMethodId);
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to subscribe',
        }));
        return null;
      }
    },
    []
  );

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await premiumService.cancelSubscription();
      setState((prev) => ({ ...prev, subscription }));
      cacheRef.current.subscription = { data: subscription, timestamp: Date.now() };
      return true;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      }));
      return false;
    }
  }, []);

  const resumeSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await premiumService.resumeSubscription();
      setState((prev) => ({ ...prev, subscription }));
      cacheRef.current.subscription = { data: subscription, timestamp: Date.now() };
      return true;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to resume subscription',
      }));
      return false;
    }
  }, []);

  const changeTier = useCallback(async (newTierId: string): Promise<boolean> => {
    try {
      const subscription = await premiumService.changeSubscriptionTier(newTierId);
      setState((prev) => ({ ...prev, subscription }));
      cacheRef.current.subscription = { data: subscription, timestamp: Date.now() };
      return true;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to change tier',
      }));
      return false;
    }
  }, []);

  const loadPerks = useCallback(async () => {
    try {
      const perks = await premiumService.getPremiumPerks();
      setState((prev) => ({ ...prev, perks }));
    } catch (error) {
      console.error('Failed to load perks:', error);
    }
  }, []);

  // ==================== COIN FUNCTIONS ====================

  const refreshCoinBalance = useCallback(async () => {
    if (isCacheValid(cacheRef.current.coinBalance)) {
      setState((prev) => ({ ...prev, coinBalance: cacheRef.current.coinBalance!.data ?? null }));
      return;
    }

    try {
      const coinBalance = await premiumService.getCoinBalance();
      cacheRef.current.coinBalance = { data: coinBalance, timestamp: Date.now() };
      setState((prev) => ({ ...prev, coinBalance }));
    } catch (error) {
      console.error('Failed to load coin balance:', error);
    }
  }, [isCacheValid]);

  const loadCoinPackages = useCallback(async () => {
    try {
      const coinPackages = await premiumService.getCoinPackages();
      setState((prev) => ({ ...prev, coinPackages }));
    } catch (error) {
      console.error('Failed to load coin packages:', error);
    }
  }, []);

  const purchaseCoins = useCallback(
    async (
      packageId: string,
      paymentMethodId: string
    ): Promise<{ clientSecret: string } | null> => {
      try {
        const result = await premiumService.purchaseCoinPackage(packageId, paymentMethodId);
        return { clientSecret: result.clientSecret };
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to purchase coins',
        }));
        return null;
      }
    },
    []
  );

  const loadTransactions = useCallback(async () => {
    try {
      const transactions = await premiumService.getCoinTransactions();
      setState((prev) => ({ ...prev, transactions }));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }, []);

  // ==================== SHOP FUNCTIONS ====================

  const loadShopCategories = useCallback(async () => {
    try {
      const shopCategories = await premiumService.getShopCategories();
      setState((prev) => ({ ...prev, shopCategories }));
    } catch (error) {
      console.error('Failed to load shop categories:', error);
    }
  }, []);

  const loadCategoryItems = useCallback(async (categoryId: string): Promise<ShopItem[]> => {
    try {
      return await premiumService.getShopItems(categoryId);
    } catch (error) {
      console.error('Failed to load category items:', error);
      return [];
    }
  }, []);

  const loadFeaturedItems = useCallback(async () => {
    try {
      const featuredItems = await premiumService.getFeaturedItems();
      setState((prev) => ({ ...prev, featuredItems }));
    } catch (error) {
      console.error('Failed to load featured items:', error);
    }
  }, []);

  const purchaseItem = useCallback(async (itemId: string): Promise<PurchaseResult | null> => {
    try {
      const result = await premiumService.purchaseItem(itemId);

      // Update coin balance
      setState((prev) => ({
        ...prev,
        coinBalance: prev.coinBalance ? { ...prev.coinBalance, balance: result.newBalance } : null,
        inventory: [...prev.inventory, result.item].slice(-200),
      }));

      return result;
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to purchase item',
      }));
      return null;
    }
  }, []);

  const equipItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      await premiumService.equipItem(itemId);

      setState((prev) => ({
        ...prev,
        inventory: prev.inventory.map((item) =>
          item.id === itemId ? { ...item, equipped: true } : item
        ),
      }));

      return true;
    } catch (error) {
      console.error('Failed to equip item:', error);
      return false;
    }
  }, []);

  const unequipItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      await premiumService.unequipItem(itemId);

      setState((prev) => ({
        ...prev,
        inventory: prev.inventory.map((item) =>
          item.id === itemId ? { ...item, equipped: false } : item
        ),
      }));

      return true;
    } catch (error) {
      console.error('Failed to unequip item:', error);
      return false;
    }
  }, []);

  const loadInventory = useCallback(async () => {
    try {
      const inventory = await premiumService.getInventory();
      setState((prev) => ({ ...prev, inventory }));
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  }, []);

  const giftItem = useCallback(
    async (itemId: string, recipientUsername: string, message?: string): Promise<boolean> => {
      try {
        await premiumService.giftItem(itemId, recipientUsername, message);
        return true;
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to gift item',
        }));
        return false;
      }
    },
    []
  );

  // ==================== COMPUTED VALUES ====================

  const isPremium = state.subscription?.tier !== 'free' && state.subscription?.status === 'active';
  const premiumTier = state.subscription?.tier || 'free';
  const coins = state.coinBalance?.balance || 0;
  const hasActiveSubscription =
    state.subscription?.status === 'active' && !state.subscription.cancelAtPeriodEnd;

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (autoLoad) {
      refreshSubscription();
      refreshCoinBalance();
    }
  }, [autoLoad, refreshSubscription, refreshCoinBalance]);

  return {
    ...state,
    refreshSubscription,
    loadTiers,
    subscribe,
    cancelSubscription,
    resumeSubscription,
    changeTier,
    loadPerks,
    refreshCoinBalance,
    loadCoinPackages,
    purchaseCoins,
    loadTransactions,
    loadShopCategories,
    loadCategoryItems,
    loadFeaturedItems,
    purchaseItem,
    equipItem,
    unequipItem,
    loadInventory,
    giftItem,
    isPremium,
    premiumTier,
    coins,
    hasActiveSubscription,
  };
}

export default usePremium;
