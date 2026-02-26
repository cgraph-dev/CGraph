/**
 * Level progress bar component.
 * @module
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, FireIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useGamificationStore } from '@/modules/gamification/store';
import {
  calculateXPForLevel,
  getStreakMultiplier,
  XP_NOTIFICATION_DURATION,
  glowPulseCompact,
  glowPulseExpanded,
  glowTransitionCompact,
  glowTransitionExpanded,
  shimmerTransition,
  progressBarTransitionCompact,
  progressBarTransitionExpanded,
  barShimmerTransition,
} from '@/modules/gamification/components/level-progress.constants';

interface LevelProgressProps {
  variant?: 'compact' | 'expanded';
  showStreak?: boolean;
  className?: string;
}

/**
 * Level Progress component.
 */
export default function LevelProgress({
  variant = 'compact',
  showStreak = true,
  className = '',
}: LevelProgressProps) {
  const { level, currentXP, totalXP, loginStreak } = useGamificationStore();
  const [recentXPGain, setRecentXPGain] = useState<{ amount: number; source: string } | null>(null);
  const [prevTotalXP, setPrevTotalXP] = useState(totalXP);
  const xpTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const xpForCurrentLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const neededXP = xpForNextLevel - xpForCurrentLevel;
  const progressXP = currentXP;
  const progressPercent = neededXP > 0 ? Math.min((progressXP / neededXP) * 100, 100) : 0;
  const streak = loginStreak;
  const streakMultiplier = getStreakMultiplier(streak);

  useEffect(() => {
    if (totalXP > prevTotalXP) {
      const gained = totalXP - prevTotalXP;
      setRecentXPGain({ amount: gained, source: 'Action completed' });
      HapticFeedback.success();
      clearTimeout(xpTimeoutRef.current);
      xpTimeoutRef.current = setTimeout(() => setRecentXPGain(null), XP_NOTIFICATION_DURATION);
    }
    setPrevTotalXP(totalXP);
    return () => clearTimeout(xpTimeoutRef.current);
  }, [totalXP, prevTotalXP]);

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <GlassCard variant="frosted" glow className="p-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="relative h-12 w-12 flex-shrink-0"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600">
                <div className="absolute inset-0.5 flex items-center justify-center rounded-full bg-dark-900">
                  <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent">
                    {level}
                  </span>
                </div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-purple-400"
                animate={glowPulseCompact}
                transition={glowTransitionCompact}
                style={{ filter: 'blur(8px)' }}
              />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Level {level}</span>
                <span className="text-xs text-gray-400">
                  {progressXP.toLocaleString()} / {neededXP.toLocaleString()} XP
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-dark-800">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={progressBarTransitionCompact}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-400 to-purple-400 opacity-50"
                  animate={{ x: ['0%', '100%'] }}
                  transition={barShimmerTransition}
                  style={{ width: '20%', filter: 'blur(4px)' }}
                />
              </div>
            </div>

            {showStreak && streak > 0 && (
              <motion.div
                className="flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/20 px-2 py-1"
                whileHover={{ scale: 1.05 }}
                title={`${streak} day streak! ${streakMultiplier}x XP multiplier`}
              >
                <FireIcon className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-bold text-orange-400">{streak}</span>
              </motion.div>
            )}
          </div>
        </GlassCard>

        <AnimatePresence>
          {recentXPGain && (
            <motion.div
              className="absolute -top-2 right-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 shadow-lg"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
            >
              <span className="text-sm font-bold text-white">+{recentXPGain.amount} XP</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={className}>
      <GlassCard variant="holographic" glow borderGradient className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <SparklesIcon className="h-5 w-5 text-primary-400" />
              Your Progress
            </h3>
            <span className="text-xs text-gray-400">{totalXP.toLocaleString()} Total XP</span>
          </div>

          <div className="flex items-center gap-4">
            <motion.div
              className="relative h-20 w-20 flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-1">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-dark-900">
                  <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
                    {level}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Level</span>
                </div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-purple-400"
                animate={glowPulseExpanded}
                transition={glowTransitionExpanded}
                style={{ filter: 'blur(12px)' }}
              />
            </motion.div>

            <div className="flex-1">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white">
                  {progressXP.toLocaleString()} XP
                </span>
                <span className="text-sm text-gray-400">
                  {(neededXP - progressXP).toLocaleString()} XP to level {level + 1}
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-dark-800">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #10b981, #8b5cf6, #ec4899)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={progressBarTransitionExpanded}
                />
                <motion.div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={shimmerTransition}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">{progressPercent.toFixed(1)}% complete</span>
                {showStreak && streak > 0 && (
                  <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5">
                    <FireIcon className="h-3 w-3 text-orange-400" />
                    <span className="font-semibold text-orange-400">{streak} day streak</span>
                    <span className="text-orange-300">({streakMultiplier}x XP)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
            <div className="text-center">
              <div className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
                {level}
              </div>
              <div className="mt-1 text-xs text-gray-500">Current Level</div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent">
                {totalXP.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-gray-500">Total XP</div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-2xl font-bold text-transparent">
                {streak}
              </div>
              <div className="mt-1 text-xs text-gray-500">Day Streak</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <AnimatePresence>
        {recentXPGain && (
          <motion.div
            className="mt-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <GlassCard variant="neon" glow className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">
                    +{recentXPGain.amount} XP Earned!
                  </div>
                  <div className="text-xs text-gray-400">{recentXPGain.source}</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
