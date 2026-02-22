/**
 * RewardCard Component
 *
 * Individual reward card in the calendar grid
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { GiftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import type { RewardCardProps } from './types';
import { ANIMATION_DURATIONS } from './constants';

/**
 * Single day reward card with status indicators
 */
export const RewardCard = memo<RewardCardProps>(function RewardCard({
  reward,
  index,
  currentDay,
  canClaim,
  isPremium,
  primaryColor,
}) {
  const isToday = reward.day === currentDay;
  const isClaimed = reward.claimed || reward.day < currentDay;
  const isLocked = reward.day > currentDay;
  const isPremiumLocked = reward.isPremium && !isPremium;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * ANIMATION_DURATIONS.cardStagger }}
      className={`relative flex flex-col items-center rounded-xl p-3 transition-all ${
        isToday && canClaim
          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-2 ring-offset-2 ring-offset-dark-800'
          : isClaimed
            ? 'bg-dark-700/50 opacity-60'
            : isLocked
              ? 'bg-dark-800'
              : 'bg-dark-700'
      }`}
      style={
        isToday && canClaim ? ({ '--tw-ring-color': primaryColor } as React.CSSProperties) : {}
      }
    >
      {/* Day Badge */}
      <div
        className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          isClaimed
            ? 'bg-green-500 text-white'
            : isToday
              ? 'text-white'
              : 'bg-dark-600 text-gray-400'
        }`}
        style={isToday && !isClaimed ? { backgroundColor: primaryColor } : {}}
      >
        {isClaimed ? '✓' : reward.day}
      </div>

      {/* Icon */}
      <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
        {reward.special?.icon ? (
          <span className="text-2xl">{reward.special.icon}</span>
        ) : (
          <GiftIcon
            className={`h-6 w-6 ${
              isClaimed ? 'text-gray-500' : isLocked ? 'text-gray-600' : 'text-amber-500'
            }`}
          />
        )}

        {isPremiumLocked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-dark-900/70">
            <StarIcon className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </div>

      {/* Rewards */}
      <div className="space-y-0.5 text-center">
        <div className="flex items-center gap-1 text-xs">
          <SparklesIcon className="h-3 w-3 text-purple-400" />
          <span>{reward.xp}</span>
        </div>
        {reward.coins && (
          <div className="flex items-center gap-1 text-xs">
            <span>🪙</span>
            <span>{reward.coins}</span>
          </div>
        )}
      </div>

      {/* Premium indicator */}
      {reward.isPremium && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
          VIP
        </div>
      )}
    </motion.div>
  );
});

export default RewardCard;
