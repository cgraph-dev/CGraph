import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, FireIcon } from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useGamificationStore } from '@/stores/gamificationStore';

/**
 * Level Progress Widget
 *
 * Displays the user's current level, XP progress, and advancement status.
 * Features:
 * - Animated progress bar with gradient fill
 * - Level-up celebration animations
 * - XP gain notifications with source attribution
 * - Streak multiplier indicator
 * - Next level preview with required XP
 * - Compact and expanded view modes
 * - Real-time updates via store subscriptions
 *
 * This widget provides constant positive reinforcement for user actions,
 * making progress visible and rewarding without being intrusive.
 */

interface LevelProgressProps {
  variant?: 'compact' | 'expanded';
  showStreak?: boolean;
  className?: string;
}

// XP calculation helper
function calculateXPForLevel(level: number): number {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(level, 1.8));
}

export default function LevelProgress({
  variant = 'compact',
  showStreak = true,
  className = '',
}: LevelProgressProps) {
  const { level, currentXP, totalXP, loginStreak } = useGamificationStore();
  const [recentXPGain, setRecentXPGain] = useState<{ amount: number; source: string } | null>(null);
  const [prevTotalXP, setPrevTotalXP] = useState(totalXP);

  // Calculate XP needed for next level
  const xpForCurrentLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const neededXP = xpForNextLevel - xpForCurrentLevel;
  const progressXP = currentXP;
  const progressPercent = neededXP > 0 ? Math.min((progressXP / neededXP) * 100, 100) : 0;
  const streak = loginStreak;

  // Detect XP gains and show notification
  useEffect(() => {
    if (totalXP > prevTotalXP) {
      const gained = totalXP - prevTotalXP;
      setRecentXPGain({ amount: gained, source: 'Action completed' });
      HapticFeedback.success();

      setTimeout(() => setRecentXPGain(null), 3000);
    }
    setPrevTotalXP(totalXP);
  }, [totalXP, prevTotalXP]);

  // Streak multiplier display
  const streakMultiplier = streak >= 7 ? 2.0 : streak >= 3 ? 1.5 : 1.0;

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <GlassCard variant="frosted" glow className="p-3">
          <div className="flex items-center gap-3">
            {/* Level Badge */}
            <motion.div
              className="relative h-12 w-12 flex-shrink-0"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <div className="absolute inset-0.5 rounded-full bg-dark-900 flex items-center justify-center">
                  <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                    {level}
                  </span>
                </div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-purple-400"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ filter: 'blur(8px)' }}
              />
            </motion.div>

            {/* Progress Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">Level {level}</span>
                <span className="text-xs text-gray-400">
                  {progressXP.toLocaleString()} / {neededXP.toLocaleString()} XP
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-dark-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-purple-400 rounded-full opacity-50"
                  animate={{
                    x: ['0%', '100%'],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '20%', filter: 'blur(4px)' }}
                />
              </div>
            </div>

            {/* Streak Indicator */}
            {showStreak && streak > 0 && (
              <motion.div
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30"
                whileHover={{ scale: 1.05 }}
                title={`${streak} day streak! ${streakMultiplier}x XP multiplier`}
              >
                <FireIcon className="h-4 w-4 text-orange-400" />
                <span className="text-sm font-bold text-orange-400">{streak}</span>
              </motion.div>
            )}
          </div>
        </GlassCard>

        {/* XP Gain Notification */}
        <AnimatePresence>
          {recentXPGain && (
            <motion.div
              className="absolute -top-2 right-0 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg"
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

  // Expanded variant
  return (
    <div className={className}>
      <GlassCard variant="holographic" glow borderGradient className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary-400" />
              Your Progress
            </h3>
            <span className="text-xs text-gray-400">{totalXP.toLocaleString()} Total XP</span>
          </div>

          {/* Level Display */}
          <div className="flex items-center gap-4">
            <motion.div
              className="relative h-20 w-20 flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-1">
                <div className="h-full w-full rounded-full bg-dark-900 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                    {level}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Level</span>
                </div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400 to-purple-400"
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ filter: 'blur(12px)' }}
              />
            </motion.div>

            <div className="flex-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold text-white">
                  {progressXP.toLocaleString()} XP
                </span>
                <span className="text-sm text-gray-400">
                  {(neededXP - progressXP).toLocaleString()} XP to level {level + 1}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-dark-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #10b981, #8b5cf6, #ec4899)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  }}
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">{progressPercent.toFixed(1)}% complete</span>
                {showStreak && streak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                    <FireIcon className="h-3 w-3 text-orange-400" />
                    <span className="text-orange-400 font-semibold">{streak} day streak</span>
                    <span className="text-orange-300">({streakMultiplier}x XP)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                {level}
              </div>
              <div className="text-xs text-gray-500 mt-1">Current Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {totalXP.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                {streak}
              </div>
              <div className="text-xs text-gray-500 mt-1">Day Streak</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* XP Gain Notification */}
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
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">+{recentXPGain.amount} XP Earned!</div>
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
