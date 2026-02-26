/**
 * Reward Tiers
 *
 * List of reward tiers with claim buttons.
 */

import { GiftIcon } from '@heroicons/react/24/outline';
import type { RewardTiersProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Reward Tiers component.
 */
export function RewardTiers({ tiers, onClaimReward }: RewardTiersProps) {
  return (
    <div className="bg-card border-border overflow-hidden rounded-lg border">
      <div className="border-border border-b p-4">
        <h3 className="text-foreground flex items-center gap-2 font-semibold">
          <GiftIcon className="text-primary h-5 w-5" />
          Reward Tiers
        </h3>
      </div>

      <div className="divide-border divide-y">
        {tiers.map((tier) => (
          <div key={tier.id} className={`p-4 ${tier.achieved ? 'bg-green-500/5' : ''}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-foreground font-medium">{tier.name}</span>
              <span className="text-muted-foreground text-xs">
                {tier.referralsRequired} referrals
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {tier.rewards.map((reward) => (
                <div key={reward.id} className="flex items-center gap-1">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      reward.claimed
                        ? 'bg-green-500/10 text-green-500'
                        : tier.achieved
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {reward.description}
                  </span>
                  {tier.achieved && !reward.claimed && (
                    <button
                      onClick={() => onClaimReward(reward.id)}
                      className="text-primary text-xs hover:underline"
                    >
                      Claim
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
