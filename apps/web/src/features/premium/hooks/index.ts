/**
 * Premium Hooks
 *
 * Custom React hooks for premium functionality.
 * Connected to authStore and gamificationStore for actual data.
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to check premium status and features
 */
export function usePremiumStatus() {
  const { user } = useAuthStore();
  const isPremium = user?.isPremium ?? false;
  const tier = isPremium ? 'premium' : 'free';
  const expiresAt = null; // Could be extended to store subscription expiry

  const hasFeature = useCallback(
    (feature: string) => {
      // Premium features list
      const premiumFeatures = [
        'custom_themes',
        'animated_avatars',
        'priority_support',
        'advanced_analytics',
        'extra_storage',
        'custom_emojis',
      ];
      if (!isPremium) return false;
      return premiumFeatures.includes(feature);
    },
    [isPremium]
  );

  return {
    isPremium,
    tier,
    expiresAt,
    hasFeature,
  };
}

/**
 * Hook to manage coin balance and transactions
 */
export function useCoins() {
  const { user, updateUser } = useAuthStore();
  const balance = user?.coins ?? 0;

  const spend = useCallback(
    async (amount: number, itemId: string) => {
      if (balance < amount) return false;
      try {
        const { api } = await import('@/lib/api');
        const response = await api.post('/api/v1/shop/purchase', {
          item_id: itemId,
          amount,
        });
        const newBalance = (response.data as { coins: number }).coins;
        updateUser({ coins: newBalance });
        return true;
      } catch {
        return false;
      }
    },
    [balance, updateUser]
  );

  const purchase = useCallback(
    async (packageId: string) => {
      try {
        const { api } = await import('@/lib/api');
        const response = await api.post('/api/v1/coins/purchase', {
          package_id: packageId,
        });
        // Returns Stripe checkout URL or similar
        return response.data as { checkout_url: string };
      } catch {
        return null;
      }
    },
    []
  );

  return {
    balance,
    spend,
    purchase,
  };
}
