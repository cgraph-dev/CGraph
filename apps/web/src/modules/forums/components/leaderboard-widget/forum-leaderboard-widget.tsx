/**
 * ForumLeaderboardWidget - Forum-specific leaderboard showing top contributors
 *
 * Updated to use unified scoring (karma + XP), rank badges, and period selector.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { isRecord } from '@/lib/api-utils';
import { TrophyIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';
import { RankBadge } from './rank-badge';

import type { Contributor, TimeRange, ForumLeaderboardWidgetProps } from './types';
import { UserRow } from './user-row';

const logger = createLogger('LeaderboardWidget');

interface RankInfo {
  name: string;
  color: string;
  image_url?: string | null;
}

/**
 * Forum Leaderboard Widget component.
 */
export function ForumLeaderboardWidget({
  forumId,
  forumSlug,
  limit = 5,
}: ForumLeaderboardWidgetProps) {
  const [contributors, setContributors] = useState<(Contributor & { rank_info?: RankInfo })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [myScore, setMyScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchContributors = async () => {
      setIsLoading(true);
      try {
        // Use unified leaderboard endpoint
        const period = timeRange === 'week' ? 'weekly' : timeRange === 'month' ? 'monthly' : 'all_time';
        const response = await api.get(`/api/v1/forums/${forumId}/leaderboard`, {
          params: { period, limit },
        });

        const data = response.data?.data || [];
        setContributors(
          data.map((c: Record<string, unknown>) => {
            const userObj = isRecord(c.user) ? c.user : {};
            const rankObj = isRecord(c.rank) ? c.rank : null;
            return {
              rank: c.position,
              user: {
                id: userObj.id,
                username: userObj.username,
                displayName: userObj.display_name,
                avatarUrl: userObj.avatar_url,
                avatarBorderId: userObj.avatar_border_id || userObj.avatarBorderId || null,
                isVerified: userObj.is_verified,
                karma: userObj.karma,
              },
              forumKarma: c.forum_karma ?? c.score ?? 0,
              rank_info: rankObj ? {
                name: rankObj.name as string,
                color: rankObj.color as string,
                image_url: rankObj.image_url as string | null,
              } : undefined,
            };
          })
        );

        // Fetch my rank summary
        try {
          const myRankResp = await api.get(`/api/v1/forums/${forumId}/leaderboard/my-rank`);
          setMyScore(myRankResp.data?.data?.score ?? null);
        } catch {
          // Not critical
        }
      } catch (err) {
        logger.error('Failed to fetch forum contributors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributors();
  }, [forumId, limit, timeRange]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white/[0.06] p-4">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-6 animate-pulse rounded bg-white/[0.08]" />
          <div className="h-4 w-24 animate-pulse rounded bg-white/[0.08]" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-white/[0.08]" />
              <div className="h-8 w-8 rounded-full bg-white/[0.08]" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-20 rounded bg-white/[0.08]" />
                <div className="h-2 w-12 rounded bg-white/[0.08]" />
              </div>
              <div className="h-4 w-10 rounded bg-white/[0.08]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className="rounded-lg bg-white/[0.06] p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="text-sm font-semibold text-white">Top Contributors</h3>
        </div>
        <p className="py-4 text-center text-sm text-gray-500">No contributors yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white/[0.06] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-1.5">
            <TrophyIcon className="h-4 w-4 text-yellow-500" />
          </div>
          <h3 className="text-sm font-semibold text-white">Top Contributors</h3>
        </div>

        {/* Time Range Toggle */}
        <div className="flex items-center gap-1">
          // type assertion: array literal matches TimeRange union type
          { }
          {(['week', 'month', 'all'] as TimeRange[]).map(
            (
              range // safe downcast — literals match TimeRange
            ) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  timeRange === range
                    ? 'bg-primary-600/30 text-primary-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {range === 'all' ? '∞' : range === 'week' ? '7d' : '30d'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Contributors List */}
      <div className="space-y-1">
        {contributors.map((contributor) => (
          <div key={contributor.user.id} className="flex items-center gap-1">
            <div className="flex-1">
              <UserRow
                rank={contributor.rank}
                userId={contributor.user.id}
                username={contributor.user.username}
                displayName={contributor.user.displayName}
                avatarUrl={contributor.user.avatarUrl}
                avatarBorderId={contributor.user.avatarBorderId}
                karma={contributor.forumKarma}
                isVerified={contributor.user.isVerified}
              />
            </div>
            {contributor.rank_info && (
              <RankBadge
                rankName={contributor.rank_info.name}
                rankImage={contributor.rank_info.image_url}
                rankColor={contributor.rank_info.color}
                size="sm"
              />
            )}
          </div>
        ))}
      </div>

      {/* My Score Summary */}
      {myScore != null && (
        <div className="mt-2 rounded-md bg-primary-600/10 px-3 py-2 text-center text-xs text-primary-400">
          Your score: <span className="font-semibold">{Math.round(myScore).toLocaleString()}</span>
        </div>
      )}

      {/* View Full Leaderboard Link */}
      <Link
        to={`/forums/${forumSlug}/user-leaderboard`}
        className="mt-3 flex items-center justify-center gap-1 border-t border-white/[0.08] pt-3 text-sm text-primary-400 transition-colors hover:text-primary-300"
      >
        View full leaderboard
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
