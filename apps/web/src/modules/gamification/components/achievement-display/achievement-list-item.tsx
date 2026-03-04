/**
 * AchievementListItem component - list view row for an achievement
 */

import { motion } from 'motion/react';
import { TrophyIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { RARITY_COLORS } from './constants';
import type { Achievement } from './types';

interface AchievementListItemProps {
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
 * Achievement List Item component.
 */
export function AchievementListItem({
  achievement,
  index,
  unlocked,
  progress,
  showProgress,
  onClick,
}: AchievementListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-4 border-b border-dark-700 p-4 transition-colors hover:bg-dark-700/50 ${
        !unlocked ? 'opacity-70' : ''
      }`}
    >
      {/* Icon */}
      <div
        className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${RARITY_COLORS[achievement.rarity]}20` }}
      >
        {achievement.iconUrl ? (
          <img
            src={achievement.iconUrl}
            alt={achievement.name}
            className={`h-8 w-8 ${!unlocked ? 'grayscale' : ''}`}
          />
        ) : (
          <TrophyIcon className="h-6 w-6" style={{ color: RARITY_COLORS[achievement.rarity] }} />
        )}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-dark-900/50">
            <LockClosedIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate font-medium">{achievement.name}</h4>
          <span
            className="rounded px-1.5 py-0.5 text-xs font-medium capitalize"
            style={{
              backgroundColor: `${RARITY_COLORS[achievement.rarity]}20`,
              color: RARITY_COLORS[achievement.rarity],
            }}
          >
            {achievement.rarity}
          </span>
        </div>
        <p className="truncate text-sm text-gray-400">{achievement.description}</p>
      </div>

      {/* Progress / Status */}
      <div className="flex items-center gap-3">
        {!unlocked && showProgress && achievement.targetProgress && (
          <div className="text-right">
            <div className="text-sm font-medium">{Math.round(progress)}%</div>
            <div className="text-xs text-gray-400">
              {achievement.currentProgress || 0}/{achievement.targetProgress}
            </div>
          </div>
        )}
        {unlocked && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
      </div>
    </motion.div>
  );
}
