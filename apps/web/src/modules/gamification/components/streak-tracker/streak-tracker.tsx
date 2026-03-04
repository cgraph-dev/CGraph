/**
 * StreakTracker Component
 *
 * Displays and encourages daily login streaks:
 * - Current streak display with fire animation
 * - Weekly streak calendar
 * - Streak milestones and rewards
 * - Streak freeze protection indicator
 * - Next milestone preview
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { GiftIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import confetti from 'canvas-confetti';
import { FireAnimation } from './fire-animation';
import { WeeklyCalendar } from './weekly-calendar';
import { MilestoneProgress } from './milestone-progress';
import { ClaimableMilestones } from './claimable-milestones';
import { MilestonesList } from './milestones-list';
import { StreakWidgetVariant, StreakCompactVariant } from './streak-variants';
import { DEFAULT_MILESTONES } from './constants';
import type { StreakTrackerProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Streak Tracker component.
 */
export function StreakTracker({
  currentStreak,
  longestStreak,
  weeklyProgress,
  milestones = DEFAULT_MILESTONES,
  hasFreeze = false,
  freezesRemaining = 0,
  onClaimDaily,
  onClaimMilestone,
  onUseFreeze: _onUseFreeze,
  todayClaimed = false,
  streakMultiplier = 1.0,
  variant = 'default',
  className = '',
}: StreakTrackerProps) {
  void _onUseFreeze;
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const [isClaiming, setIsClaiming] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [claimingMilestone, setClaimingMilestone] = useState<number | null>(null);

  const handleClaimDaily = async () => {
    if (todayClaimed || isClaiming || !onClaimDaily) return;
    setIsClaiming(true);
    HapticFeedback.success();
    try {
      await onClaimDaily();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: [primaryColor, '#FFD700', '#FF6B6B'],
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimMilestone = async (days: number) => {
    if (claimingMilestone || !onClaimMilestone) return;
    setClaimingMilestone(days);
    HapticFeedback.success();
    try {
      await onClaimMilestone(days);
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
    } finally {
      setClaimingMilestone(null);
    }
  };

  if (variant === 'widget') {
    return (
      <StreakWidgetVariant
        currentStreak={currentStreak}
        streakMultiplier={streakMultiplier}
        todayClaimed={todayClaimed}
        primaryColor={primaryColor}
        isClaiming={isClaiming}
        onClaimDaily={handleClaimDaily}
        className={className}
      />
    );
  }

  if (variant === 'compact') {
    return (
      <StreakCompactVariant
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        weeklyProgress={weeklyProgress}
        todayClaimed={todayClaimed}
        primaryColor={primaryColor}
        isClaiming={isClaiming}
        onClaimDaily={handleClaimDaily}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Main Streak Display */}
        <div className="bg-gradient-to-b from-orange-500/10 to-transparent p-6 text-center">
          <FireAnimation currentStreak={currentStreak} />

          <div className="mt-4">
            <motion.span
              className="text-5xl font-bold"
              key={currentStreak}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {currentStreak}
            </motion.span>
            <span className="ml-2 text-xl text-gray-400">day streak</span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-400">
              Best: <span className="font-medium text-white">{longestStreak}</span>
            </span>
            {streakMultiplier > 1 && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-medium text-amber-400">
                {streakMultiplier}x XP Bonus
              </span>
            )}
            {hasFreeze && freezesRemaining > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <LockClosedIcon className="h-4 w-4" />
                {freezesRemaining} freeze{freezesRemaining !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Daily Claim Button */}
          {!todayClaimed && onClaimDaily && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClaimDaily}
              disabled={isClaiming}
              className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              <GiftIcon className="h-5 w-5" />
              {isClaiming ? 'Claiming...' : 'Claim Daily Reward'}
            </motion.button>
          )}

          {todayClaimed && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-500">
              <CheckCircleIcon className="h-6 w-6" />
              <span className="font-medium">Today's reward claimed!</span>
            </div>
          )}
        </div>

        {/* Weekly Calendar */}
        <div className="px-6 pb-4">
          <WeeklyCalendar weeklyProgress={weeklyProgress} todayClaimed={todayClaimed} />
        </div>

        {/* Milestone Progress */}
        <div className="px-6 pb-6">
          <MilestoneProgress currentStreak={currentStreak} milestones={milestones} />
        </div>

        {/* Claimable Milestones */}
        <ClaimableMilestones
          milestones={milestones}
          currentStreak={currentStreak}
          onClaim={handleClaimMilestone}
          claimingMilestone={claimingMilestone}
        />

        {/* View All Milestones Toggle */}
        <button
          onClick={() => setShowMilestones(!showMilestones)}
          className="w-full border-t border-dark-700 p-4 text-sm text-gray-400 transition-colors hover:bg-dark-700/50 hover:text-white"
        >
          {showMilestones ? 'Hide' : 'View'} All Milestones
        </button>

        <MilestonesList
          milestones={milestones}
          currentStreak={currentStreak}
          isVisible={showMilestones}
        />
      </GlassCard>
    </div>
  );
}

export default StreakTracker;
