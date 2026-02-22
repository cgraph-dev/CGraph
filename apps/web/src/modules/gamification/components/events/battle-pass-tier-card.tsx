import { StarIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { BattlePassTier } from '@/modules/gamification/store';
import { RewardCard } from '@/modules/gamification/components/events/reward-card';

export interface BattlePassTierCardProps {
  tier: BattlePassTier;
  currentTier: number;
  hasPremium: boolean;
}

export function BattlePassTierCard({ tier, currentTier, hasPremium }: BattlePassTierCardProps) {
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
