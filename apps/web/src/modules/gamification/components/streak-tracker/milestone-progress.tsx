/**
 * Milestone Progress Component
 *
 * Shows progress toward the next milestone
 */

import { motion } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import type { MilestoneProgressProps } from './types';
import { tweens } from '@/lib/animation-presets';

/**
 * unknown for the gamification module.
 */
/**
 * Milestone Progress component.
 */
export function MilestoneProgress({ currentStreak, milestones }: MilestoneProgressProps) {
  const nextMilestone = milestones.find((m) => m.days > currentStreak && !m.claimed);
  const progressToNext = nextMilestone ? (currentStreak / nextMilestone.days) * 100 : 100;

  return (
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
          transition={tweens.smooth}
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
}
