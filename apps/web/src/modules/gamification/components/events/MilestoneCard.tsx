import { TrophyIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { EventMilestone } from '@/modules/gamification/store';
import { GlassCard } from '@/shared/components/ui';
import { RewardCard } from '@/modules/gamification/components/events/RewardCard';

export interface MilestoneCardProps {
  milestone: EventMilestone;
  currentPoints: number;
  onClaim?: () => void;
  isClaimed?: boolean;
  isClaiming?: boolean;
}

export function MilestoneCard({
  milestone,
  currentPoints,
  onClaim,
  isClaimed = false,
  isClaiming = false,
}: MilestoneCardProps) {
  const isUnlocked = currentPoints >= milestone.pointsRequired;
  const canClaim = isUnlocked && !isClaimed;

  return (
    <GlassCard variant="frosted" className="p-4">
      <div className="flex items-start gap-4">
        {/* Progress indicator */}
        <div className="flex-shrink-0">
          {isClaimed ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500 bg-green-500/20">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
          ) : isUnlocked ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-yellow-500 bg-yellow-500/20">
              <TrophyIcon className="h-6 w-6 text-yellow-500" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 bg-white/5">
              <LockClosedIcon className="h-5 w-5 text-white/40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {milestone.pointsRequired.toLocaleString()} Points
              </h4>
              {milestone.description && (
                <p className="mt-0.5 text-xs text-white/60">{milestone.description}</p>
              )}
            </div>
            {canClaim && (
              <button
                onClick={onClaim}
                disabled={isClaiming}
                className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50"
              >
                {isClaiming ? 'Claiming...' : 'Claim'}
              </button>
            )}
          </div>

          {/* Rewards */}
          <div className="mt-3 flex flex-wrap gap-3">
            {milestone.rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} size="sm" showLabel={false} />
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
