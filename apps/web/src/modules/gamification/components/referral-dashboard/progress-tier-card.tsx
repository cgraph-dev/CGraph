/**
 * Progress Tier Card
 *
 * Shows progress toward the next reward tier.
 */

import type { ProgressTierProps } from './types';

export function ProgressTierCard({ nextTier, verifiedReferrals }: ProgressTierProps) {
  if (!nextTier) return null;

  return (
    <div className="bg-card border-border rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-foreground font-medium">Progress to {nextTier.tier.name}</h3>
        <span className="text-muted-foreground text-sm">
          {verifiedReferrals} / {nextTier.tier.referralsRequired} referrals
        </span>
      </div>
      <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
        <div
          className="from-primary to-primary/70 h-full rounded-full bg-gradient-to-r transition-all duration-500"
          style={{ width: `${nextTier.progress}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {nextTier.tier.rewards.map((reward, i) => (
          <span key={i} className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs">
            {reward.description}
          </span>
        ))}
      </div>
    </div>
  );
}
