/**
 * CoinPackageCard – individual package card for the default CoinShopWidget variant.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FireIcon, StarIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components';
import type { CoinPackage } from '@/modules/premium/store/types';
import { CoinIcon } from './coin-shop-data';

export interface CoinPackageCardProps {
  pkg: CoinPackage;
  index: number;
  isSelected: boolean;
  isPurchasing: boolean;
  isBestValue: boolean;
  coinValue: string;
  onSelect: (pkg: CoinPackage) => void;
  onPurchase: (pkg: CoinPackage) => void;
}

export function CoinPackageCard({
  pkg,
  index,
  isSelected,
  isPurchasing,
  isBestValue,
  coinValue,
  onSelect,
  onPurchase,
}: CoinPackageCardProps): React.ReactElement {
  return (
    <motion.div
      key={pkg.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
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
          onClick={() => onSelect(pkg)}
        >
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

          <div className="text-center">
            <span className="text-lg font-bold text-white">${pkg.price.toFixed(2)}</span>
            <p className="mt-1 text-xs text-white/40">{coinValue} coins/$</p>
          </div>

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
                    onPurchase(pkg);
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
}
