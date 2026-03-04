/**
 * AchievementCard component - grid view card for an achievement
 */

import { motion } from 'motion/react';
import {
  TrophyIcon,
  LockClosedIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { RARITY_COLORS, RARITY_GRADIENTS } from './constants';
import type { Achievement } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
  unlocked: boolean;
  progress: number;
  showProgress: boolean;
  onClick: () => void;
}

/**
 * unknown for the gamification module.
 */
/**
 * Achievement Card display component.
 */
export function AchievementCard({
  achievement,
  index,
  unlocked,
  progress,
  showProgress,
  onClick,
}: AchievementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -5 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <GlassCard
        variant={unlocked ? 'neon' : 'frosted'}
        className={`relative overflow-hidden transition-all ${
          unlocked ? '' : 'opacity-70 grayscale-[50%]'
        }`}
      >
        {/* Rarity glow */}
        {unlocked && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${RARITY_GRADIENTS[achievement.rarity]} opacity-10`}
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={loop(tweens.ambient)}
          />
        )}

        <div className="relative p-4">
          {/* Icon */}
          <div className="mb-3 flex items-start justify-between">
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${RARITY_COLORS[achievement.rarity]}20`,
              }}
            >
              {achievement.iconUrl ? (
                <img
                  src={achievement.iconUrl}
                  alt={achievement.name}
                  className={`h-10 w-10 ${!unlocked ? 'grayscale' : ''}`}
                />
              ) : (
                <TrophyIcon
                  className="h-8 w-8"
                  style={{ color: RARITY_COLORS[achievement.rarity] }}
                />
              )}
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[rgb(30,32,40)]/[0.50]">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>

            {/* Rarity Badge */}
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              style={{
                backgroundColor: `${RARITY_COLORS[achievement.rarity]}20`,
                color: RARITY_COLORS[achievement.rarity],
              }}
            >
              {achievement.rarity}
            </span>
          </div>

          {/* Info */}
          <h4 className="mb-1 font-semibold">{achievement.name}</h4>
          <p className="mb-3 line-clamp-2 text-sm text-gray-400">{achievement.description}</p>

          {/* Progress Bar */}
          {showProgress && !unlocked && achievement.targetProgress && (
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-gray-400">Progress</span>
                <span style={{ color: RARITY_COLORS[achievement.rarity] }}>
                  {achievement.currentProgress || 0}/{achievement.targetProgress}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: RARITY_COLORS[achievement.rarity] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={tweens.smooth}
                />
              </div>
            </div>
          )}

          {/* Rewards */}
          <div className="flex items-center gap-3 text-sm">
            {achievement.xpReward > 0 && (
              <span className="flex items-center gap-1 text-purple-400">
                <SparklesIcon className="h-4 w-4" />
                {achievement.xpReward} XP
              </span>
            )}
            {achievement.coinReward > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <span>🪙</span>
                {achievement.coinReward}
              </span>
            )}
          </div>

          {/* Unlocked checkmark */}
          {unlocked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-3 top-3"
            >
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </motion.div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
