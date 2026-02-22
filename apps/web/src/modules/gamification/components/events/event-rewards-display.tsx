import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import { useCurrentEventProgress } from '@/modules/gamification/store';
import { GlassCard } from '@/shared/components/ui';
import { MilestoneCard } from '@/modules/gamification/components/events/milestone-card';
import { BattlePassTierCard } from '@/modules/gamification/components/events/battle-pass-tier-card';

/**
 * EventRewardsDisplay Component
 *
 * Displays event rewards, milestones, and battle pass tiers with:
 * - Progress tracking
 * - Claim rewards UI
 * - Free vs Premium tier display
 * - Visual reward previews
 */

export default function EventRewardsDisplay() {
  const { event, progress, nextMilestone, availableRewards } = useCurrentEventProgress();
  // Reserved for future features
  void availableRewards;

  if (!event || !progress) {
    return (
      <div className="py-12 text-center text-white/60">
        <TrophyIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>Join an event to view rewards</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Milestones */}
      {event.milestoneRewards && event.milestoneRewards.length > 0 && (
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <TrophyIcon className="h-5 w-5" />
            <span>Event Milestones</span>
          </h3>
          <div className="space-y-3">
            {event.milestoneRewards.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                currentPoints={progress.eventPoints}
                isClaimed={progress.milestonesClaimed.includes(milestone.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Battle Pass */}
      {event.hasBattlePass && event.battlePassTiers && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <StarIcon className="h-5 w-5 text-yellow-400" />
              <span>Battle Pass</span>
            </h3>
            {!progress.hasBattlePass && (
              <button className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-yellow-600 hover:to-orange-600">
                Unlock Premium ({event.battlePassCost} coins)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {event.battlePassTiers.map((tier) => (
              <BattlePassTierCard
                key={tier.tier}
                tier={tier}
                currentTier={progress.battlePassTier}
                hasPremium={progress.hasBattlePass}
              />
            ))}
          </div>
        </div>
      )}

      {/* Next milestone preview */}
      {nextMilestone && (
        <GlassCard variant="crystal" glow glowColor="rgba(234, 179, 8, 0.3)">
          <div className="flex items-center gap-3">
            <TrophyIcon className="h-8 w-8 text-yellow-400" />
            <div className="flex-1">
              <div className="mb-1 text-sm font-semibold text-white">Next Milestone</div>
              <div className="text-xs text-white/70">
                {progress.eventPoints.toLocaleString()} /{' '}
                {nextMilestone.pointsRequired.toLocaleString()} points
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                  style={{
                    width: `${Math.min(100, (progress.eventPoints / nextMilestone.pointsRequired) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
