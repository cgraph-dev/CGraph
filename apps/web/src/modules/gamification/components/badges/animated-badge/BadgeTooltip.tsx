/**
 * BadgeTooltip component - hover tooltip for badge details
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/stores/gamificationStore';
import type { RarityColorConfig } from './types';

interface BadgeTooltipProps {
  achievement: Achievement;
  colors: RarityColorConfig;
  isVisible: boolean;
}

export function BadgeTooltip({ achievement, colors, isVisible }: BadgeTooltipProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2',
            'rounded-xl px-4 py-3',
            'bg-dark-800/95 backdrop-blur-xl',
            'border border-white/10',
            'shadow-xl shadow-black/50',
            'min-w-[200px] max-w-[280px]',
            'pointer-events-none'
          )}
        >
          <div className="space-y-2 text-center">
            {/* Title */}
            <p className="font-bold text-white">
              {achievement.unlocked || !achievement.isHidden ? achievement.title : '???'}
            </p>

            {/* Description */}
            <p className="text-sm text-gray-400">
              {achievement.unlocked || !achievement.isHidden
                ? achievement.description
                : 'Complete hidden requirements to unlock'}
            </p>

            {/* Rarity badge */}
            <div className="flex items-center justify-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary,
                }}
              >
                {achievement.rarity}
              </span>
              <span className="text-xs text-gray-500">+{achievement.xpReward} XP</span>
            </div>

            {/* Progress bar */}
            {!achievement.unlocked && achievement.maxProgress > 1 && (
              <div className="pt-2">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>
                    {achievement.progress} / {achievement.maxProgress}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-dark-600">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Unlocked date */}
            {achievement.unlocked && achievement.unlockedAt && (
              <p className="pt-1 text-xs text-gray-500">
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </p>
            )}

            {/* Title reward */}
            {achievement.titleReward && (
              <p className="pt-1 text-xs text-primary-400">
                Rewards: "{achievement.titleReward}" title
              </p>
            )}
          </div>

          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-dark-800/95" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
