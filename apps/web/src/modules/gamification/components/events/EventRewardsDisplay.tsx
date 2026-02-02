import { motion } from 'framer-motion';
import {
  TrophyIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  BoltIcon,
  StarIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useCurrentEventProgress } from '@/stores/gamification';
import type { EventReward, EventMilestone, BattlePassTier } from '@/stores/gamification';
import { GlassCard } from '@/shared/components/ui';

/**
 * EventRewardsDisplay Component
 *
 * Displays event rewards, milestones, and battle pass tiers with:
 * - Progress tracking
 * - Claim rewards UI
 * - Free vs Premium tier display
 * - Visual reward previews
 */

// ==================== REWARD ICON ====================

function RewardIcon({ reward }: { reward: EventReward }) {
  const iconClass = 'h-5 w-5';

  switch (reward.type) {
    case 'coins':
      return <CurrencyDollarIcon className={`${iconClass} text-yellow-400`} />;
    case 'gems':
      return <SparklesIcon className={`${iconClass} text-blue-400`} />;
    case 'xp':
      return <BoltIcon className={`${iconClass} text-purple-400`} />;
    case 'title':
      return <StarIcon className={`${iconClass} text-pink-400`} />;
    case 'border':
      return <TrophyIcon className={`${iconClass} text-orange-400`} />;
    case 'effect':
      return <SparklesIcon className={`${iconClass} text-cyan-400`} />;
    case 'badge':
      return <StarIcon className={`${iconClass} text-green-400`} />;
    default:
      return <TrophyIcon className={iconClass} />;
  }
}

// ==================== REWARD CARD ====================

interface RewardCardProps {
  reward: EventReward;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function RewardCard({ reward, size = 'md', showLabel = true }: RewardCardProps) {
  const sizeClasses = {
    sm: 'h-12 w-12 text-xs',
    md: 'h-16 w-16 text-sm',
    lg: 'h-20 w-20 text-base',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const rarityColors = {
    common: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
    uncommon: 'from-green-500/20 to-green-600/20 border-green-500/30',
    rare: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    epic: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    legendary: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    mythic: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
  };

  const rarityColor = reward.rarity
    ? rarityColors[reward.rarity as keyof typeof rarityColors] || rarityColors.common
    : 'from-white/5 to-white/10 border-white/20';

  return (
    <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${rarityColor} relative flex items-center justify-center overflow-hidden border`}
      >
        {reward.previewUrl ? (
          <img src={reward.previewUrl} alt={reward.name} className="h-full w-full object-cover" />
        ) : (
          <div className={iconSizes[size]}>
            <RewardIcon reward={reward} />
          </div>
        )}
        {reward.amount && (
          <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white">
            {reward.amount}
          </div>
        )}
      </div>
      {showLabel && (
        <span className="max-w-[80px] truncate text-center text-xs text-white/70">
          {reward.name}
        </span>
      )}
    </motion.div>
  );
}

// ==================== MILESTONE DISPLAY ====================

interface MilestoneCardProps {
  milestone: EventMilestone;
  currentPoints: number;
  onClaim?: () => void;
  isClaimed?: boolean;
  isClaiming?: boolean;
}

function MilestoneCard({
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

// ==================== BATTLE PASS TIER ====================

interface BattlePassTierCardProps {
  tier: BattlePassTier;
  currentTier: number;
  hasPremium: boolean;
}

function BattlePassTierCard({ tier, currentTier, hasPremium }: BattlePassTierCardProps) {
  const isUnlocked = currentTier >= tier.tier;
  const isCurrent = currentTier === tier.tier;

  return (
    <div
      className={`relative rounded-xl border p-4 ${
        isCurrent
          ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10'
          : isUnlocked
            ? 'border-white/20 bg-white/5'
            : 'border-white/10 bg-white/5 opacity-50'
      }`}
    >
      {/* Tier number */}
      <div className="mb-3 text-center">
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-bold ${
            isUnlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/40'
          }`}
        >
          {tier.tier}
        </div>
        <div className="mt-1 text-xs text-white/60">{tier.xpRequired.toLocaleString()} XP</div>
      </div>

      {/* Free rewards */}
      <div className="mb-3">
        <div className="mb-2 text-xs font-semibold text-white/70">Free</div>
        <div className="flex flex-wrap justify-center gap-2">
          {tier.freeRewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} size="sm" showLabel={false} />
          ))}
        </div>
      </div>

      {/* Premium rewards */}
      {tier.premiumRewards.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-center gap-1 text-xs font-semibold text-yellow-400">
            <StarIcon className="h-3 w-3" />
            <span>Premium</span>
          </div>
          <div className="relative flex flex-wrap justify-center gap-2">
            {!hasPremium && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
                <LockClosedIcon className="h-5 w-5 text-white/60" />
              </div>
            )}
            {tier.premiumRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} size="sm" showLabel={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

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
