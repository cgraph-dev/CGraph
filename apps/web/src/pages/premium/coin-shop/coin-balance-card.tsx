/**
 * CoinBalanceCard component - displays user's coin balance
 */

import { motion } from 'motion/react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { tweens, loop } from '@/lib/animation-presets';

interface CoinBalanceCardProps {
  balance: number;
}

/**
 * unknown for the premium module.
 */
/**
 * Coin Balance Card display component.
 */
export function CoinBalanceCard({ balance }: CoinBalanceCardProps) {
  return (
    <GlassCard variant="holographic" glow glowColor="rgba(245, 158, 11, 0.3)" className="p-4">
      <div className="flex items-center gap-4">
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={loop(tweens.ambient)}
        >
          <CurrencyDollarIcon className="h-6 w-6 text-white" />
        </motion.div>
        <div>
          <p className="text-sm text-gray-400">Your Balance</p>
          <p className="text-2xl font-bold text-yellow-400">{(balance ?? 0).toLocaleString()}</p>
        </div>
      </div>
    </GlassCard>
  );
}
