/**
 * Milestones List Component
 *
 * Shows all milestones with their status
 */

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircleIcon, GiftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { MilestonesListProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Milestones List component.
 */
export function MilestonesList({ milestones, currentStreak, isVisible }: MilestonesListProps) {
  return (
    <AnimatePresence>
      {isVisible && (
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
  );
}
