/**
 * Claimable Milestones Component
 *
 * Shows milestones that are ready to be claimed
 */

import { motion } from 'framer-motion';
import { TrophyIcon } from '@heroicons/react/24/outline';
import type { ClaimableMilestonesProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Claimable Milestones component.
 */
export function ClaimableMilestones({
  milestones,
  currentStreak,
  onClaim,
  claimingMilestone,
}: ClaimableMilestonesProps) {
  const claimableMilestones = milestones.filter((m) => m.days <= currentStreak && !m.claimed);

  if (claimableMilestones.length === 0) return null;

  return (
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
              onClick={() => onClaim(milestone.days)}
              disabled={claimingMilestone === milestone.days}
              className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-black"
            >
              {claimingMilestone === milestone.days ? '...' : 'Claim'}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
