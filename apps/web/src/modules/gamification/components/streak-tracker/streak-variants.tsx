/**
 * Streak Tracker Variant Components
 *
 * Widget and Compact variants of the StreakTracker
 */

import { motion } from 'framer-motion';
import { GiftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { FireIcon as FireIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { WeeklyCalendar } from './weekly-calendar';
import type { StreakTrackerProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface WidgetVariantProps {
  currentStreak: number;
  streakMultiplier: number;
  todayClaimed: boolean;
  primaryColor: string;
  isClaiming: boolean;
  onClaimDaily?: () => Promise<void>;
  className?: string;
}

/**
 * unknown for the gamification module.
 */
/**
 * Streak Widget Variant component.
 */
export function StreakWidgetVariant({
  currentStreak,
  streakMultiplier,
  todayClaimed,
  primaryColor,
  isClaiming,
  onClaimDaily,
  className = '',
}: WidgetVariantProps) {
  return (
    <GlassCard variant="frosted" className={`p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={loop(tweens.verySlow)}
        >
          <FireIconSolid className="h-10 w-10 text-orange-500" />
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{currentStreak}</span>
            <span className="text-sm text-gray-400">day streak</span>
          </div>
          {streakMultiplier > 1 && (
            <span className="text-xs text-amber-400">{streakMultiplier}x XP bonus active</span>
          )}
        </div>
        {!todayClaimed && onClaimDaily && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClaimDaily}
            disabled={isClaiming}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            {isClaiming ? '...' : 'Claim'}
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
}

interface CompactVariantProps extends Pick<StreakTrackerProps, 'weeklyProgress'> {
  currentStreak: number;
  longestStreak: number;
  todayClaimed: boolean;
  primaryColor: string;
  isClaiming: boolean;
  onClaimDaily?: () => Promise<void>;
  className?: string;
}

/**
 * unknown for the gamification module.
 */
/**
 * Streak Compact Variant component.
 */
export function StreakCompactVariant({
  currentStreak,
  longestStreak,
  weeklyProgress,
  todayClaimed,
  primaryColor,
  isClaiming,
  onClaimDaily,
  className = '',
}: CompactVariantProps) {
  return (
    <GlassCard variant="frosted" className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FireIconSolid className="h-8 w-8 text-orange-500" />
          <div>
            <div className="text-lg font-bold">{currentStreak} Day Streak</div>
            <div className="text-xs text-gray-400">Best: {longestStreak} days</div>
          </div>
        </div>
        {!todayClaimed && onClaimDaily && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClaimDaily}
            disabled={isClaiming}
            className="flex items-center gap-2 rounded-lg px-4 py-2 font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            <GiftIcon className="h-5 w-5" />
            {isClaiming ? 'Claiming...' : 'Claim Today'}
          </motion.button>
        )}
        {todayClaimed && (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm">Claimed</span>
          </div>
        )}
      </div>
      <WeeklyCalendar weeklyProgress={weeklyProgress} todayClaimed={todayClaimed} />
    </GlassCard>
  );
}
