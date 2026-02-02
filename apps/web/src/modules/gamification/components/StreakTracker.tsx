import React, { useState, useEffect } from 'react';
void React; // Used for JSX transform compatibility
void useEffect; // Reserved for future streak tracking features
import { motion, AnimatePresence } from 'framer-motion';
import {
  FireIcon,
  CalendarDaysIcon,
  GiftIcon,
  SparklesIcon,
  CheckCircleIcon,
  LockClosedIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
void FireIcon; // Reserved for streak fire animation
void CalendarDaysIcon; // Reserved for calendar view
import { FireIcon as FireIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import confetti from 'canvas-confetti';

/**
 * StreakTracker Component
 *
 * Displays and encourages daily login streaks:
 * - Current streak display with fire animation
 * - Weekly streak calendar
 * - Streak milestones and rewards
 * - Streak freeze protection indicator
 * - Next milestone preview
 * - Streak recovery option
 */

interface StreakDay {
  date: string;
  completed: boolean;
  reward?: {
    xp: number;
    coins?: number;
    special?: string;
  };
}

interface StreakMilestone {
  days: number;
  reward: {
    xp: number;
    coins?: number;
    title?: string;
    badge?: string;
  };
  claimed: boolean;
}

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: StreakDay[];
  milestones?: StreakMilestone[];
  hasFreeze?: boolean;
  freezesRemaining?: number;
  onClaimDaily?: () => Promise<void>;
  onClaimMilestone?: (days: number) => Promise<void>;
  onUseFreeze?: () => Promise<void>;
  todayClaimed?: boolean;
  streakMultiplier?: number;
  variant?: 'default' | 'compact' | 'widget';
  className?: string;
}

const DEFAULT_MILESTONES: StreakMilestone[] = [
  { days: 7, reward: { xp: 500, coins: 100 }, claimed: false },
  { days: 14, reward: { xp: 1000, coins: 250 }, claimed: false },
  { days: 30, reward: { xp: 2500, coins: 500, badge: '🔥' }, claimed: false },
  { days: 60, reward: { xp: 5000, coins: 1000, title: 'Dedicated' }, claimed: false },
  { days: 100, reward: { xp: 10000, coins: 2500, badge: '💎' }, claimed: false },
  { days: 365, reward: { xp: 50000, coins: 10000, title: 'Legendary Streak' }, claimed: false },
];

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
  void _onUseFreeze; // Reserved for future freeze feature
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const [isClaiming, setIsClaiming] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [claimingMilestone, setClaimingMilestone] = useState<number | null>(null);

  // Calculate next milestone
  const nextMilestone = milestones.find((m) => m.days > currentStreak && !m.claimed);
  const progressToNext = nextMilestone ? (currentStreak / nextMilestone.days) * 100 : 100;

  // Find claimable milestones
  const claimableMilestones = milestones.filter((m) => m.days <= currentStreak && !m.claimed);

  const handleClaimDaily = async () => {
    if (todayClaimed || isClaiming || !onClaimDaily) return;

    setIsClaiming(true);
    HapticFeedback.success();

    try {
      await onClaimDaily();

      // Celebration
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

      // Big celebration for milestones
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });
    } finally {
      setClaimingMilestone(null);
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const renderFireAnimation = () => (
    <motion.div
      className="relative"
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <FireIconSolid
        className="h-16 w-16"
        style={{ color: currentStreak >= 7 ? '#FF6B6B' : '#F97316' }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <FireIconSolid className="h-16 w-16" style={{ color: '#FFD700', filter: 'blur(8px)' }} />
      </motion.div>
    </motion.div>
  );

  const renderWeeklyCalendar = () => (
    <div className="mt-4 flex items-center justify-between gap-2">
      {weeklyProgress.map((day, index) => {
        const isToday = new Date(day.date).toDateString() === new Date().toDateString();
        return (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center"
          >
            <span className="mb-1 text-xs text-gray-400">{getDayName(day.date)}</span>
            <motion.div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                day.completed
                  ? 'bg-gradient-to-br from-orange-500 to-red-500'
                  : isToday && !todayClaimed
                    ? 'bg-dark-600 ring-2 ring-orange-500 ring-offset-2 ring-offset-dark-800'
                    : 'bg-dark-700'
              }`}
              whileHover={day.completed || isToday ? { scale: 1.1 } : {}}
            >
              {day.completed ? (
                <CheckCircleIcon className="h-5 w-5 text-white" />
              ) : (
                <span className="text-sm text-gray-500">{new Date(day.date).getDate()}</span>
              )}
            </motion.div>
            {day.reward && day.completed && (
              <span className="mt-1 text-xs text-amber-400">+{day.reward.xp}</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );

  const renderMilestoneProgress = () => (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {nextMilestone ? `Next: ${nextMilestone.days}-day streak` : 'All milestones completed!'}
        </span>
        {nextMilestone && (
          <span className="font-medium">
            {currentStreak}/{nextMilestone.days} days
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-dark-700">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressToNext}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {nextMilestone && (
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-purple-400">
            <SparklesIcon className="h-4 w-4" />+{nextMilestone.reward.xp} XP
          </span>
          {nextMilestone.reward.coins && (
            <span className="flex items-center gap-1 text-amber-400">
              <span>🪙</span>+{nextMilestone.reward.coins}
            </span>
          )}
          {nextMilestone.reward.badge && <span>{nextMilestone.reward.badge}</span>}
        </div>
      )}
    </div>
  );

  if (variant === 'widget') {
    return (
      <GlassCard variant="frosted" className={`p-4 ${className}`}>
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
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
              onClick={handleClaimDaily}
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

  if (variant === 'compact') {
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
              onClick={handleClaimDaily}
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
        {renderWeeklyCalendar()}
      </GlassCard>
    );
  }

  return (
    <div className={className}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Main Streak Display */}
        <div className="bg-gradient-to-b from-orange-500/10 to-transparent p-6 text-center">
          {renderFireAnimation()}

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
        <div className="px-6 pb-4">{renderWeeklyCalendar()}</div>

        {/* Milestone Progress */}
        <div className="px-6 pb-6">{renderMilestoneProgress()}</div>

        {/* Claimable Milestones */}
        {claimableMilestones.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <TrophyIcon className="h-5 w-5 text-amber-500" />
              Milestone Rewards Available!
            </h3>
            <div className="space-y-2">
              {claimableMilestones.map((milestone) => (
                <motion.div
                  key={milestone.days}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
                >
                  <div>
                    <span className="font-medium">{milestone.days}-Day Streak</span>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>+{milestone.reward.xp} XP</span>
                      {milestone.reward.coins && <span>+{milestone.reward.coins} coins</span>}
                      {milestone.reward.badge && <span>{milestone.reward.badge}</span>}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClaimMilestone(milestone.days)}
                    disabled={claimingMilestone === milestone.days}
                    className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-black"
                  >
                    {claimingMilestone === milestone.days ? '...' : 'Claim'}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* View All Milestones */}
        <button
          onClick={() => setShowMilestones(!showMilestones)}
          className="w-full border-t border-dark-700 p-4 text-sm text-gray-400 transition-colors hover:bg-dark-700/50 hover:text-white"
        >
          {showMilestones ? 'Hide' : 'View'} All Milestones
        </button>

        <AnimatePresence>
          {showMilestones && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 bg-dark-800/50 p-4">
                {milestones.map((milestone) => {
                  const isCompleted = milestone.days <= currentStreak;
                  const isClaimable = isCompleted && !milestone.claimed;

                  return (
                    <div
                      key={milestone.days}
                      className={`flex items-center justify-between rounded-lg p-3 ${
                        milestone.claimed
                          ? 'border border-green-500/30 bg-green-500/10'
                          : isClaimable
                            ? 'border border-amber-500/30 bg-amber-500/10'
                            : 'bg-dark-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {milestone.claimed ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-500" />
                        ) : isCompleted ? (
                          <GiftIcon className="h-6 w-6 text-amber-500" />
                        ) : (
                          <LockClosedIcon className="h-6 w-6 text-gray-500" />
                        )}
                        <div>
                          <span className="font-medium">{milestone.days} Days</span>
                          <div className="text-xs text-gray-400">
                            {milestone.reward.title && <span>{milestone.reward.title} · </span>}+
                            {milestone.reward.xp} XP
                            {milestone.reward.coins && ` · +${milestone.reward.coins} coins`}
                            {milestone.reward.badge && ` · ${milestone.reward.badge}`}
                          </div>
                        </div>
                      </div>
                      {milestone.claimed && <span className="text-sm text-green-500">Claimed</span>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

export default StreakTracker;
