/**
 * CompactView Component
 *
 * Compact variant of daily rewards display
 */

import { motion } from 'motion/react';
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { GiftIcon as GiftIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { CompactViewProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

/**
 * Compact daily rewards display
 */
export function CompactView({
  canClaim,
  todayReward,
  timeUntilClaim,
  isClaiming,
  primaryColor,
  onClaim,
  className = '',
}: CompactViewProps) {
  return (
    <GlassCard variant="frosted" className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={canClaim ? { scale: [1, 1.1, 1] } : {}}
            transition={loop(tweens.verySlow)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              canClaim ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-white/[0.06]'
            }`}
          >
            {canClaim ? (
              <GiftIconSolid className="h-6 w-6 text-white" />
            ) : (
              <ClockIcon className="h-6 w-6 text-gray-400" />
            )}
          </motion.div>
          <div>
            <div className="font-semibold">{canClaim ? 'Daily Reward Ready!' : 'Next Reward'}</div>
            <div className="text-sm text-gray-400">
              {canClaim ? (
                <span className="flex items-center gap-1">
                  <SparklesIcon className="h-4 w-4 text-purple-400" />+{todayReward.xp} XP
                  {todayReward.coins && ` · +${todayReward.coins} coins`}
                </span>
              ) : (
                timeUntilClaim
              )}
            </div>
          </div>
        </div>

        {canClaim && onClaim && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClaim}
            disabled={isClaiming}
            className="rounded-lg px-4 py-2 font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            {isClaiming ? 'Claiming...' : 'Claim'}
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
}

export default CompactView;
