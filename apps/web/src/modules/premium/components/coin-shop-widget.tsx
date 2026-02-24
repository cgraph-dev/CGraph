/** CoinShopWidget – reusable coin shop widget for purchasing virtual currency. */

import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components';
import type { CoinPackage } from '@/modules/premium/store/types';
import { DEFAULT_PACKAGES, CoinIcon } from './coin-shop-data';
import { useCoinShop } from './useCoinShop';
import { CoinPackageCard } from './coin-package-card';
import { tweens, loop } from '@/lib/animation-presets';

export interface CoinShopWidgetProps {
  variant?: 'default' | 'compact' | 'inline';
  packages?: CoinPackage[];
  onPurchase?: (pkg: CoinPackage) => void;
  showBalance?: boolean;
  maxPackages?: number;
  className?: string;
}

export function CoinShopWidget({
  variant = 'default',
  packages = DEFAULT_PACKAGES,
  onPurchase,
  showBalance = true,
  maxPackages,
  className = '',
}: CoinShopWidgetProps): React.ReactElement {
  const {
    coinBalance,
    selectedPackage,
    purchaseAnimation,
    displayPackages,
    bestValueId,
    handleSelectPackage,
    handlePurchase,
    getCoinValue,
  } = useCoinShop({ packages, maxPackages, onPurchase });

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {showBalance && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-2">
            <CoinIcon className="h-5 w-5" />
            <span className="font-semibold text-amber-400">{coinBalance.toLocaleString()}</span>
          </div>
        )}
        <Button
          onClick={() => packages[2] && onPurchase?.(packages[2])}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-white hover:opacity-90"
        >
          <PlusIcon className="h-4 w-4" />
          Get Coins
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <GlassCard variant="frosted" className={`p-4 ${className}`}>
        {showBalance && (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-white/60">Your Balance</span>
            <div className="flex items-center gap-2">
              <CoinIcon className="h-6 w-6" />
              <span className="text-xl font-bold text-amber-400">
                {coinBalance.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {displayPackages.slice(0, 3).map((pkg) => (
            <motion.button
              key={pkg.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePurchase(pkg)}
              className="rounded-xl bg-dark-800/50 p-3 text-center transition-colors hover:bg-dark-700/50"
            >
              <div className="mb-1 flex items-center justify-center gap-1">
                <CoinIcon className="h-4 w-4" />
                <span className="font-bold text-amber-400">{pkg.coins}</span>
              </div>
              <span className="text-sm text-white">${pkg.price}</span>
            </motion.button>
          ))}
        </div>
        <button
          onClick={() => packages[0] && onPurchase?.(packages[0])}
          className="mt-3 w-full text-sm text-primary-400 hover:text-primary-300"
        >
          View all packages →
        </button>
      </GlassCard>
    );
  }

  return (
    <div className={className}>
      {showBalance && (
        <GlassCard variant="crystal" className="mb-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={loop(tweens.ambient)}
                className="rounded-xl bg-amber-500/20 p-3"
              >
                <CoinIcon className="h-8 w-8" />
              </motion.div>
              <div>
                <p className="text-sm text-white/60">Your Balance</p>
                <p className="text-2xl font-bold text-amber-400">{coinBalance.toLocaleString()}</p>
              </div>
            </div>
            <SparklesIcon className="h-6 w-6 text-amber-400/50" />
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {displayPackages.map((pkg, index) => (
          <CoinPackageCard
            key={pkg.id}
            pkg={pkg}
            index={index}
            isSelected={selectedPackage === pkg.id}
            isPurchasing={purchaseAnimation === pkg.id}
            isBestValue={pkg.id === bestValueId}
            coinValue={getCoinValue(pkg)}
            onSelect={handleSelectPackage}
            onPurchase={handlePurchase}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-white/40">
        All purchases are final. Coins can be used to buy themes, badges, and more.
      </p>
    </div>
  );
}

export default CoinShopWidget;
