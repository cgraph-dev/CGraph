/**
 * unknown.
 * GlobalLeaderboardWidget - Global leaderboard showing top users across all forums
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { ChevronRightIcon, FireIcon } from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';

import type { LeaderboardUser, GlobalLeaderboardWidgetProps } from './types';
import { UserRow } from './user-row';

const logger = createLogger('LeaderboardWidget');

/**
 * Global Leaderboard Widget component.
 */
export function GlobalLeaderboardWidget({
  limit = 5,
  showTitle = true,
}: GlobalLeaderboardWidgetProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/v1/users/leaderboard', {
          params: { per_page: limit },
        });

        const data = response.data?.data || [];
        setUsers(
          data.map((u: Record<string, unknown>, index: number) => ({
             
            rank: (u.rank as number) || index + 1, // type assertion: API response field
            id: u.id,
            username: u.username,
            displayName: u.display_name,
            avatarUrl: u.avatar_url,
            avatarBorderId: u.avatar_border_id || u.avatarBorderId || null,
            karma: u.karma,
            isVerified: u.is_verified,
          }))
        );
      } catch (err) {
        logger.error('Failed to fetch global leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-primary-500/20 bg-gradient-to-br from-primary-900/30 to-purple-900/30 p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-6 animate-pulse rounded bg-dark-600" />
          <div className="h-4 w-32 animate-pulse rounded bg-dark-600" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-dark-600" />
              <div className="h-8 w-8 rounded-full bg-dark-600" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-20 rounded bg-dark-600" />
                <div className="h-2 w-12 rounded bg-dark-600" />
              </div>
              <div className="h-4 w-10 rounded bg-dark-600" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-primary-500/20 bg-gradient-to-br from-primary-900/30 to-purple-900/30 p-4">
      {showTitle && (
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20 p-1.5">
            <FireIcon className="h-4 w-4 text-primary-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Global Top Users</h3>
        </div>
      )}

      <div className="space-y-1">
        {users.map((user) => (
          <UserRow
            key={user.id}
            rank={user.rank}
            userId={user.id}
            username={user.username}
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
            avatarBorderId={user.avatarBorderId}
            karma={user.karma}
            isVerified={user.isVerified}
          />
        ))}
      </div>

      <Link
        to="/forums/leaderboard"
        className="mt-3 flex items-center justify-center gap-1 border-t border-primary-500/20 pt-3 text-sm text-primary-400 transition-colors hover:text-primary-300"
      >
        View full leaderboard
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
