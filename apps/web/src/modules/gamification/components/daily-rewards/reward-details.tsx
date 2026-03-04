/**
 * RewardDetails Component
 *
 * Today's reward details with claim button
 */

import { motion } from 'motion/react';
import { GiftIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { RewardDetailsProps } from './types';

/**
 * Today's reward details section
 */
export function RewardDetails({
  todayReward,
  canClaim,
  isClaiming,
  primaryColor,
  onClaim,
}: RewardDetailsProps) {
  return (
    <div className="px-4 pb-4">
      <GlassCard variant="crystal" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 text-sm text-gray-400">Today's Reward</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-lg font-bold">
                <SparklesIcon className="h-5 w-5 text-purple-400" />
                {todayReward.xp} XP
              </span>
              {todayReward.coins && (
                <span className="flex items-center gap-1 text-lg font-bold">
                  <span>🪙</span>
                  {todayReward.coins}
                </span>
              )}
            </div>
            {todayReward.special && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span>{todayReward.special.icon}</span>
                <span className="text-amber-400">{todayReward.special.name}</span>
              </div>
            )}
          </div>

          {canClaim && onClaim && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClaim}
              disabled={isClaiming}
              className="flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <GiftIcon className="h-5 w-5" />
              {isClaiming ? 'Claiming...' : 'Claim Reward'}
            </motion.button>
          )}

          {!canClaim && (
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              <span>Claimed</span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

export default RewardDetails;
