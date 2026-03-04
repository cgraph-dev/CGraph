/**
 * CoinBundleCard component - displays purchasable coin bundles
 */

import { motion } from 'motion/react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { CoinBundle } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface CoinBundleCardProps {
  bundle: CoinBundle;
  index: number;
  isPurchasing: boolean;
  onPurchase: (bundle: CoinBundle) => void;
  disabled: boolean;
}

/**
 * unknown for the premium module.
 */
/**
 * Coin Bundle Card display component.
 */
export function CoinBundleCard({
  bundle,
  index,
  isPurchasing,
  onPurchase,
  disabled,
}: CoinBundleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <GlassCard
        variant={bundle.popular || bundle.bestValue ? 'holographic' : 'frosted'}
        glow={bundle.popular || bundle.bestValue}
        glowColor={bundle.bestValue ? 'rgba(245, 158, 11, 0.3)' : undefined}
        className="relative h-full overflow-hidden p-4"
      >
        {/* Labels */}
        {bundle.popular && (
          <div className="absolute -right-1 -top-1">
            <div className="rounded-bl bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white">
              POPULAR
            </div>
          </div>
        )}
        {bundle.bestValue && (
          <div className="absolute -right-1 -top-1">
            <div className="rounded-bl bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-white">
              BEST VALUE
            </div>
          </div>
        )}

        <div className="text-center">
          <motion.div
            className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={loop(tweens.ambient)}
          >
            <CurrencyDollarIcon className="h-5 w-5 text-white" />
          </motion.div>

          <p className="text-xl font-bold text-white">{(bundle?.coins ?? 0).toLocaleString()}</p>
          {(bundle?.bonusCoins ?? 0) > 0 && (
            <p className="text-xs font-semibold text-green-400">+{bundle.bonusCoins} bonus</p>
          )}
          <p className="mt-2 text-lg font-semibold text-yellow-400">${bundle.price.toFixed(2)}</p>

          <motion.button
            onClick={() => onPurchase(bundle)}
            disabled={disabled}
            className="mt-3 w-full rounded-lg bg-dark-700 py-2 text-sm text-white transition-all hover:bg-dark-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isPurchasing ? (
              <motion.div
                className="mx-auto h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                animate={{ rotate: 360 }}
                transition={loop(tweens.slow)}
              />
            ) : (
              'Buy'
            )}
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
