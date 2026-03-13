/**
 * Premium Hooks (Mobile)
 *
 * Connects to backend for premium subscriptions and coin management.
 * @module features/premium/hooks
 * @version 0.8.6
 */

import { useCallback, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Linking, Platform } from 'react-native';
import paymentService, { SubscriptionStatus, Product } from '../../../lib/payment';
import { iapService, type IAPProduct } from '../services/iap-service';
import api from '../../../lib/api';
import { TIER_FEATURES } from '../services';

type TierName = keyof typeof TIER_FEATURES;

/**
 * Hook for premium subscription status
 */
export function usePremiumStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const subscriptionStatus = await paymentService.getSubscriptionStatus();
      setStatus(subscriptionStatus);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch premium status';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isPremium = status?.isActive ?? false;
  const tier = status?.tier ?? 'free';

  const hasFeature = useCallback(
    (feature: keyof typeof TIER_FEATURES.free) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const tierFeatures = TIER_FEATURES[tier as TierName] || TIER_FEATURES.free;
      const value = tierFeatures[feature];

      // Handle boolean features
      if (typeof value === 'boolean') return value;

      // Handle numeric features (-1 means unlimited)
      if (typeof value === 'number') return value > 0 || value === -1;

      return false;
    },
    [tier]
  );

  const getFeatureLimit = useCallback(
    (feature: keyof typeof TIER_FEATURES.free) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const tierFeatures = TIER_FEATURES[tier as TierName] || TIER_FEATURES.free;
      return tierFeatures[feature];
    },
    [tier]
  );

  return {
    isPremium,
    tier,
    status,
    isLoading,
    error,
    hasFeature,
    getFeatureLimit,
    refresh: fetchStatus,
  };
}

/**
 * Hook for subscription management
 */
export function useSubscription() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await paymentService.initialize();
      const allProducts = paymentService.getProducts();
      setProducts(allProducts.filter((p) => p.type === 'subscription'));
    };
    init();
  }, []);

  const subscribe = useCallback(async (productId: string) => {
    setIsSubscribing(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const purchase = await paymentService.purchaseProduct(productId);
      if (purchase) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      }
      return false;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Subscription failed';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  const cancel = useCallback(async () => {
    setIsCanceling(true);
    setError(null);

    try {
      await api.post('/api/v1/premium/cancel');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cancellation failed';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsCanceling(false);
    }
  }, []);

  const restore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const purchases = await paymentService.restorePurchases();
      if (purchases.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      }
      return false;
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  }, []);

  return {
    products,
    isSubscribing,
    isCanceling,
    error,
    subscribe,
    cancel,
    restore,
  };
}

/**
 * Hook for IAP-specific subscription actions.
 * Provides purchaseViaIAP, restoreIAP, and manageNativeSubscription.
 */
export function useIAPSubscription() {
  const [iapProducts, setIapProducts] = useState<IAPProduct[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await iapService.initialize();
        const products = await iapService.loadProducts();
        setIapProducts(products);
      } catch (err) {
        console.warn('[useIAPSubscription] IAP init failed:', err);
      }
    };
    init();

    return () => {
      iapService.destroy();
    };
  }, []);

  const purchaseViaIAP = useCallback(async (productId: string) => {
    setIsPurchasing(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await iapService.purchaseSubscription(productId, {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsPurchasing(false);
        },
        onError: (err) => {
          setError(err.message || 'Purchase failed');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setIsPurchasing(false);
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'IAP purchase failed';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsPurchasing(false);
    }
  }, []);

  const restoreIAP = useCallback(async () => {
    setIsRestoring(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await iapService.restorePurchases();
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return result.success;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Restore failed';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const manageNativeSubscription = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }, []);

  return {
    iapProducts,
    isPurchasing,
    isRestoring,
    error,
    purchaseViaIAP,
    restoreIAP,
    manageNativeSubscription,
  };
}

/**
 * Hook for coin management
 */
export function useCoins() {
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/coins/balance');
      const data = response.data?.data || response.data;
      setBalance(data.balance || data.coins || 0);
    } catch (err: unknown) {
      console.error('[useCoins] Failed to fetch balance:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await paymentService.initialize();
      const allProducts = paymentService.getProducts();
      setPackages(allProducts.filter((p) => p.type === 'consumable'));
      await fetchBalance();
      setIsLoading(false);
    };
    init();
  }, [fetchBalance]);

  const spend = useCallback(
    async (amount: number, itemId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setError(null);

      try {
        const response = await api.post('/api/v1/coins/spend', {
          amount,
          item_id: itemId,
        });

        const data = response.data?.data || response.data;
        setBalance(data.new_balance || balance - amount);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to spend coins';
        setError(message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      }
    },
    [balance]
  );

  const purchase = useCallback(
    async (packageId: string) => {
      setIsPurchasing(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      try {
        const purchaseResult = await paymentService.purchaseProduct(packageId);
        if (purchaseResult?.purchaseState === 'purchased') {
          await fetchBalance();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return true;
        }
        return false;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Purchase failed';
        setError(message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      } finally {
        setIsPurchasing(false);
      }
    },
    [fetchBalance]
  );

  return {
    balance,
    packages,
    isLoading,
    isPurchasing,
    error,
    spend,
    purchase,
    refresh: fetchBalance,
  };
}

/**
 * Hook for the premium shop (cosmetics, badges, etc.)
 */
export function useShop() {
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      category: string;
      preview_url?: string;
    }>
  >([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShop = useCallback(async () => {
    setIsLoading(true);
    try {
      const [shopRes, inventoryRes] = await Promise.allSettled([
        api.get('/api/v1/premium/shop'),
        api.get('/api/v1/premium/inventory'),
      ]);

      if (shopRes.status === 'fulfilled') {
        const data = shopRes.value.data?.data || shopRes.value.data?.items || shopRes.value.data;
        setItems(Array.isArray(data) ? data : []);
      }

      if (inventoryRes.status === 'fulfilled') {
        const data =
          inventoryRes.value.data?.data ||
          inventoryRes.value.data?.items ||
          inventoryRes.value.data;
        setInventory(Array.isArray(data) ? data.map((i: { id: string }) => i.id) : []);
      }
    } catch (err: unknown) {
      console.error('[useShop] Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const purchaseItem = useCallback(async (itemId: string) => {
    setIsPurchasing(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await api.post(`/api/v1/premium/shop/${itemId}/purchase`);
      setInventory((prev) => [...prev, itemId]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      setError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const isOwned = useCallback(
    (itemId: string) => {
      return inventory.includes(itemId);
    },
    [inventory]
  );

  return {
    items,
    inventory,
    isLoading,
    isPurchasing,
    error,
    purchaseItem,
    isOwned,
    refresh: fetchShop,
  };
}

/**
 * Hook for haptic feedback on premium actions
 */
export function usePremiumHaptics() {
  const onPurchase = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const onUnlock = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const onSubscribe = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  return {
    onPurchase,
    onUnlock,
    onSubscribe,
  };
}
