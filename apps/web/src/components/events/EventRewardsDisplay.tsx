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
import { useCurrentEventProgress } from '@/stores/seasonalEventStore';
import type { EventReward, EventMilestone, BattlePassTier } from '@/stores/seasonalEventStore';
import GlassCard from '@/components/ui/GlassCard';

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
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${rarityColor} border flex items-center justify-center relative overflow-hidden`}
      >
        {reward.previewUrl ? (
          <img src={reward.previewUrl} alt={reward.name} className="w-full h-full object-cover" />
        ) : (
          <div className={iconSizes[size]}>
            <RewardIcon reward={reward} />
          </div>
        )}
        {reward.amount && (
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs font-bold text-white">
            {reward.amount}
          </div>
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-center text-white/70 max-w-[80px] truncate">
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
    <GlassCard variant="frost" className="p-4">
      <div className="flex items-start gap-4">
        {/* Progress indicator */}
        <div className="flex-shrink-0">
          {isClaimed ? (
            <div className="h-12 w-12 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
          ) : isUnlocked ? (
            <div className="h-12 w-12 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
              <TrophyIcon className="h-6 w-6 text-yellow-500" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full bg-white/5 border-2 border-white/20 flex items-center justify-center">
              <LockClosedIcon className="h-5 w-5 text-white/40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {milestone.pointsRequired.toLocaleString()} Points
              </h4>
              {milestone.description && (
                <p className="text-xs text-white/60 mt-0.5">{milestone.description}</p>
              )}
            </div>
            {canClaim && (
              <button
                onClick={onClaim}
                disabled={isClaiming}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
              >
                {isClaiming ? 'Claiming...' : 'Claim'}
              </button>
            )}
          </div>

          {/* Rewards */}
          <div className="flex flex-wrap gap-3 mt-3">
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
      className={`relative p-4 rounded-xl border ${
        isCurrent
          ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/50'
          : isUnlocked
          ? 'bg-white/5 border-white/20'
          : 'bg-white/5 border-white/10 opacity-50'
      }`}
    >
      {/* Tier number */}
      <div className="text-center mb-3">
        <div
          className={`inline-flex items-center justify-center h-10 w-10 rounded-full font-bold ${
            isUnlocked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/40'
          }`}
        >
          {tier.tier}
        </div>
        <div className="text-xs text-white/60 mt-1">{tier.xpRequired.toLocaleString()} XP</div>
      </div>

      {/* Free rewards */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-white/70 mb-2">Free</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {tier.freeRewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} size="sm" showLabel={false} />
          ))}
        </div>
      </div>

      {/* Premium rewards */}
      {tier.premiumRewards.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1 justify-center">
            <StarIcon className="h-3 w-3" />
            <span>Premium</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center relative">
            {!hasPremium && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
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

  if (!event || !progress) {
    return (
      <div className="text-center py-12 text-white/60">
        <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Join an event to view rewards</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Milestones */}
      {event.milestoneRewards && event.milestoneRewards.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-yellow-400" />
              <span>Battle Pass</span>
            </h3>
            {!progress.hasBattlePass && (
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-semibold transition-all">
                Unlock Premium ({event.battlePassCost} coins)
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <div className="text-sm font-semibold text-white mb-1">Next Milestone</div>
              <div className="text-xs text-white/70">
                {progress.eventPoints.toLocaleString()} / {nextMilestone.pointsRequired.toLocaleString()} points
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
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
