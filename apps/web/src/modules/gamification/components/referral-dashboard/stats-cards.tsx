/**
 * Stats Cards
 *
 * Grid of stat cards showing referral statistics.
 */

import {
  UsersIcon,
  CheckIcon,
  SparklesIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import type { StatsCardsProps } from './types';

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="bg-card border-border rounded-lg border p-4">
        <UsersIcon className="text-primary mb-2 h-6 w-6" />
        <div className="text-foreground text-2xl font-bold">{stats?.totalReferrals || 0}</div>
        <div className="text-muted-foreground text-sm">Total Referrals</div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <CheckIcon className="mb-2 h-6 w-6 text-green-500" />
        <div className="text-foreground text-2xl font-bold">{stats?.verifiedReferrals || 0}</div>
        <div className="text-muted-foreground text-sm">Verified</div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <SparklesIcon className="mb-2 h-6 w-6 text-yellow-500" />
        <div className="text-foreground text-2xl font-bold">
          {stats?.totalRewardsEarned.xp.toLocaleString() || 0}
        </div>
        <div className="text-muted-foreground text-sm">XP Earned</div>
      </div>

      <div className="bg-card border-border rounded-lg border p-4">
        <TrophyIcon className="mb-2 h-6 w-6 text-amber-500" />
        <div className="text-foreground flex items-center gap-1 text-2xl font-bold">
          #{stats?.rank || '-'}
          {stats?.rankChange !== 0 && (
            <span
              className={`text-sm ${stats?.rankChange && stats.rankChange > 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {stats?.rankChange && stats.rankChange > 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
        <div className="text-muted-foreground text-sm">Your Rank</div>
      </div>
    </div>
  );
}
