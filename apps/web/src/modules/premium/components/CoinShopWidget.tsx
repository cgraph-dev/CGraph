/**
 * CoinShopWidget Component
 *
 * Reusable coin shop widget for purchasing virtual currency.
 * Features:
 * - Coin bundle display with bonuses
 * - Popular/best value badges
 * - Animated purchase flow
 * - Current balance display
 * - Multiple variants
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, FireIcon, StarIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { usePremiumStore } from '@/features/premium/stores';
import type { CoinPackage } from '@/features/premium/stores/types';

export interface CoinShopWidgetProps {
  variant?: 'default' | 'compact' | 'inline';
  packages?: CoinPackage[];
  onPurchase?: (pkg: CoinPackage) => void;
  showBalance?: boolean;
  maxPackages?: number;
  className?: string;
}

const DEFAULT_PACKAGES: CoinPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    coins: 100,
    bonusCoins: 0,
    price: 0.99,
    currency: 'USD',
    isPopular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    coins: 500,
    bonusCoins: 50,
    price: 4.99,
    currency: 'USD',
    isPopular: false,
  },
  {
    id: 'popular',
    name: 'Popular',
    coins: 1200,
    bonusCoins: 200,
    price: 9.99,
    currency: 'USD',
    isPopular: true,
  },
  {
    id: 'value',
    name: 'Great Value',
    coins: 2500,
    bonusCoins: 500,
    price: 19.99,
    currency: 'USD',
    isPopular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    coins: 5500,
    bonusCoins: 1500,
    price: 39.99,
    currency: 'USD',
    isPopular: false,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    coins: 12000,
    bonusCoins: 4000,
    price: 79.99,
    currency: 'USD',
    isPopular: false,
  },
];

const CoinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#coinGradient)" />
    <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
      $
    </text>
    <defs>
      <linearGradient id="coinGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
);

export const CoinShopWidget: React.FC<CoinShopWidgetProps> = ({
  variant = 'default',
  packages = DEFAULT_PACKAGES,
  onPurchase,
  showBalance = true,
  maxPackages,
  className = '',
}) => {
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

  const getCoinValue = (pkg: CoinPackage) => {
    return ((pkg.coins + pkg.bonusCoins) / pkg.price).toFixed(0);
  };

  const getBestValue = () => {
    return packages.reduce((best, pkg) => {
      const value = (pkg.coins + pkg.bonusCoins) / pkg.price;
      const bestValue = (best.coins + best.bonusCoins) / best.price;
      return value > bestValue ? pkg : best;
    });
  };

  const bestValueId = getBestValue().id;

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
      {/* Balance display */}
      {showBalance && (
        <GlassCard variant="crystal" className="mb-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
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

      {/* Packages grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {displayPackages.map((pkg, index) => {
          const isSelected = selectedPackage === pkg.id;
          const isPurchasing = purchaseAnimation === pkg.id;
          const isBestValue = pkg.id === bestValueId;

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {/* Badges */}
              {pkg.isPopular && (
                <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-bold text-white">
                    <FireIcon className="h-3 w-3" /> Popular
                  </span>
                </div>
              )}
              {isBestValue && !pkg.isPopular && (
                <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
                    <StarIcon className="h-3 w-3" /> Best Value
                  </span>
                </div>
              )}

              <motion.div whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }}>
                <GlassCard
                  variant={pkg.isPopular ? 'holographic' : 'frosted'}
                  className={`cursor-pointer p-4 transition-all ${isSelected ? 'ring-2 ring-primary-500' : ''} ${pkg.isPopular ? 'ring-2 ring-purple-500/50' : ''} `}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  {/* Coins display */}
                  <div className="mb-3 text-center">
                    <div className="mb-1 flex items-center justify-center gap-1">
                      <CoinIcon className="h-6 w-6" />
                      <span className="text-2xl font-bold text-amber-400">
                        {pkg.coins.toLocaleString()}
                      </span>
                    </div>
                    {pkg.bonusCoins > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400"
                      >
                        <PlusIcon className="h-3 w-3" />
                        {pkg.bonusCoins} bonus
                      </motion.div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <span className="text-lg font-bold text-white">${pkg.price.toFixed(2)}</span>
                    <p className="mt-1 text-xs text-white/40">{getCoinValue(pkg)} coins/$</p>
                  </div>

                  {/* Purchase button */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 border-t border-white/10 pt-3"
                      >
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(pkg);
                          }}
                          disabled={isPurchasing}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2 font-semibold text-white"
                        >
                          {isPurchasing ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.5 }}
                            >
                              <CheckIcon className="h-4 w-4" />
                            </motion.div>
                          ) : (
                            'Buy Now'
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Info text */}
      <p className="mt-4 text-center text-xs text-white/40">
        All purchases are final. Coins can be used to buy themes, badges, and more.
      </p>
    </div>
  );
};

export default CoinShopWidget;
