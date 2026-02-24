/**
 * DailyBonusBanner component - displays claimable daily bonus
 */

import { motion } from 'framer-motion';
import { GiftIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { DailyBonus } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface DailyBonusBannerProps {
  dailyBonus: DailyBonus;
  onClaim: () => void;
}

export function DailyBonusBanner({ dailyBonus, onClaim }: DailyBonusBannerProps) {
  if (!dailyBonus.available) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <GlassCard variant="neon" glow className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500"
              animate={{ rotate: [0, 360] }}
              transition={loop(tweens.decorative)}
            >
              <GiftIcon className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <p className="font-semibold text-white">Daily Bonus Available!</p>
              <p className="text-sm text-gray-400">
                Claim {dailyBonus.amount} free coins every day
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClaim}
            className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2 font-semibold text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Claim +{dailyBonus.amount}
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
