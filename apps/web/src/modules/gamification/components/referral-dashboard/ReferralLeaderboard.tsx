/**
 * Referral Leaderboard
 *
 * Top referrers leaderboard with time period selector.
 */

import { Link } from 'react-router-dom';
import { TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import type { LeaderboardProps } from './types';

export function ReferralLeaderboard({ leaderboard, period, onPeriodChange }: LeaderboardProps) {
  return (
    <div className="bg-card border-border overflow-hidden rounded-lg border">
      <div className="border-border border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground flex items-center gap-2 font-semibold">
            <TrophyIcon className="h-5 w-5 text-amber-500" />
            Leaderboard
          </h3>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as typeof period)}
            className="bg-muted rounded border-0 px-2 py-1 text-xs"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center text-sm">No data yet</div>
      ) : (
        <div className="divide-border divide-y">
          {leaderboard.slice(0, 10).map((leader, index) => (
            <div key={leader.userId} className="flex items-center gap-3 p-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  index === 0
                    ? 'bg-amber-500 text-white'
                    : index === 1
                      ? 'bg-gray-400 text-white'
                      : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-muted text-muted-foreground'
                }`}
              >
                {leader.rank}
              </div>
              {leader.avatarUrl ? (
                <ThemedAvatar
                  src={leader.avatarUrl}
                  alt={leader.username}
                  size="xs"
                  className="h-8 w-8"
                />
              ) : (
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                  <UsersIcon className="text-primary h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/profile/${leader.username}`}
                  className="text-foreground hover:text-primary block truncate font-medium"
                >
                  {leader.displayName || leader.username}
                </Link>
              </div>
              <div className="text-foreground text-sm font-medium">{leader.referralCount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
