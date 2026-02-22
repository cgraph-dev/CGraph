/**
 * useCoinShop – state & logic for CoinShopWidget
 */

import { useState, useCallback, useMemo } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { usePremiumStore } from '@/modules/premium/store';
import type { CoinPackage } from '@/modules/premium/store/types';

export interface UseCoinShopOptions {
  packages: CoinPackage[];
  maxPackages?: number;
  onPurchase?: (pkg: CoinPackage) => void;
}

export function useCoinShop({ packages, maxPackages, onPurchase }: UseCoinShopOptions) {
  const { coinBalance } = usePremiumStore();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);

  const displayPackages = maxPackages ? packages.slice(0, maxPackages) : packages;

  const handleSelectPackage = (pkg: CoinPackage) => {
    HapticFeedback.light();
    setSelectedPackage(pkg.id);
  };

  const handlePurchase = useCallback(
    (pkg: CoinPackage) => {
      HapticFeedback.medium();
      setPurchaseAnimation(pkg.id);

      setTimeout(() => {
        setPurchaseAnimation(null);
        setSelectedPackage(null);
        onPurchase?.(pkg);
      }, 500);
    },
    [onPurchase]
  );

  const getCoinValue = (pkg: CoinPackage) => ((pkg.coins + pkg.bonusCoins) / pkg.price).toFixed(0);

  const bestValueId = useMemo(
    () =>
      packages.reduce((best, pkg) => {
        const value = (pkg.coins + pkg.bonusCoins) / pkg.price;
        const bestValue = (best.coins + best.bonusCoins) / best.price;
        return value > bestValue ? pkg : best;
      }).id,
    [packages]
  );

  return {
    coinBalance,
    selectedPackage,
    purchaseAnimation,
    displayPackages,
    bestValueId,
    handleSelectPackage,
    handlePurchase,
    getCoinValue,
  } as const;
}
