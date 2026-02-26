/**
 * useCoinShop hook - state and logic for coin shop
 */

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { CoinBundle, ShopItem, DailyBonus } from './types';

const logger = createLogger('CoinShop');

/**
 * unknown for the premium module.
 */
/**
 * Hook for managing coin shop.
 */
export function useCoinShop() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [purchasingBundle, setPurchasingBundle] = useState<string | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [dailyBonus, setDailyBonus] = useState<DailyBonus>({
    available: true,
    amount: 25,
  });

  // Fetch owned items on mount
  useEffect(() => {
    async function fetchOwnedItems() {
      try {
        const response = await api.get('/api/v1/shop/owned');
        setOwnedItems(response.data.items || []);
        setCoinBalance(response.data.coin_balance || 0);
        setDailyBonus(response.data.daily_bonus || dailyBonus);
      } catch (error) {
        logger.error('Failed to fetch owned items:', error);
      }
    }
    fetchOwnedItems();
  }, []);

  // Handle coin bundle purchase
  const handlePurchaseBundle = useCallback(
    async (bundle: CoinBundle) => {
      if (purchasingBundle) return;

      setPurchasingBundle(bundle.id);
      HapticFeedback.medium();

      try {
        const response = await api.post('/api/v1/shop/purchase-coins', {
          bundle_id: bundle.id,
        });

        if (response.data.checkout_url) {
          const { safeRedirect } = await import('@/lib/security');
          safeRedirect(response.data.checkout_url);
        } else {
          // Success
          const newBalance = coinBalance + bundle.coins + bundle.bonusCoins;
          setCoinBalance(newBalance);

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
          });
        }
      } catch (error) {
        logger.error('Purchase error:', error);
      } finally {
        setPurchasingBundle(null);
      }
    },
    [purchasingBundle, coinBalance]
  );

  // Handle item purchase with coins
  const handlePurchaseItem = useCallback(
    async (item: ShopItem) => {
      if (purchasingItem || coinBalance < item.coinPrice || ownedItems.includes(item.id)) return;

      setPurchasingItem(item.id);
      HapticFeedback.medium();

      try {
        await api.post('/api/v1/shop/purchase-item', {
          item_id: item.id,
        });

        // Success
        setCoinBalance((prev: number) => prev - item.coinPrice);
        setOwnedItems((prev: string[]) => [...prev, item.id]);

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#8b5cf6', '#f59e0b'],
        });
      } catch (error) {
        logger.error('Purchase error:', error);
      } finally {
        setPurchasingItem(null);
      }
    },
    [purchasingItem, coinBalance, ownedItems]
  );

  // Claim daily bonus
  const handleClaimDailyBonus = useCallback(async () => {
    if (!dailyBonus.available) return;

    HapticFeedback.success();

    try {
      const response = await api.post('/api/v1/shop/claim-daily');
      setCoinBalance((prev: number) => prev + (response.data.amount || dailyBonus.amount));
      setDailyBonus({ available: false, amount: dailyBonus.amount });

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (error) {
      logger.error('Failed to claim bonus:', error);
    }
  }, [dailyBonus]);

  return {
    coinBalance,
    purchasingBundle,
    purchasingItem,
    ownedItems,
    dailyBonus,
    handlePurchaseBundle,
    handlePurchaseItem,
    handleClaimDailyBonus,
  };
}
