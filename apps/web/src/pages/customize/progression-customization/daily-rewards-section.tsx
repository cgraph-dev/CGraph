/**
 * Daily rewards customization section.
 * @module
 */
import { motion } from 'framer-motion';
import { FireIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { DailyRewardsSectionProps } from './types';

/**
 * unknown for the customize module.
 */
/**
 * Daily Rewards Section section component.
 */
export function DailyRewardsSection({ rewards, currentStreak, onClaim }: DailyRewardsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Streak Display */}
      <GlassCard variant="holographic" className="p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-3">
          <FireIcon className="h-12 w-12 text-orange-500" />
          <div>
            <p className="text-4xl font-bold text-white">{currentStreak}</p>
            <p className="text-sm text-white/60">Day Streak</p>
          </div>
        </div>
        <p className="text-sm text-white/60">Keep logging in daily to maintain your streak!</p>
      </GlassCard>

      {/* Reward Calendar */}
      <div className="grid grid-cols-7 gap-3">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.day}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard
              variant={
                reward.claimed
                  ? 'neon'
                  : reward.day === currentStreak + 1
                    ? 'holographic'
                    : 'crystal'
              }
              glow={reward.day === currentStreak + 1}
              className={`relative p-4 text-center ${reward.claimed ? 'opacity-70' : ''}`}
            >
              {/* Day Number */}
              <div className="mb-2 text-2xl font-bold text-white">Day {reward.day}</div>

              {/* Reward Icon */}
              <div className="mb-2 text-3xl">
                {reward.reward.item ? '🎁' : reward.day === 7 ? '💎' : '🪙'}
              </div>

              {/* Rewards */}
              <div className="space-y-1 text-xs">
                {reward.reward.xp && (
                  <p className="font-medium text-yellow-400">+{reward.reward.xp} XP</p>
                )}
                {reward.reward.coins && (
                  <p className="font-medium text-blue-400">+{reward.reward.coins} Coins</p>
                )}
                {reward.reward.item && (
                  <p className="font-medium text-purple-400">{reward.reward.item}</p>
                )}
              </div>

              {/* Status */}
              {reward.claimed ? (
                <div className="mt-2">
                  <CheckCircleIconSolid className="mx-auto h-5 w-5 text-green-400" />
                </div>
              ) : reward.day === currentStreak + 1 ? (
                <button
                  onClick={() => onClaim(reward.day)}
                  className="mt-2 w-full rounded bg-primary-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Claim
                </button>
              ) : (
                <div className="mt-2 text-xs text-white/40">
                  {reward.day < currentStreak + 1 ? 'Missed' : 'Locked'}
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
