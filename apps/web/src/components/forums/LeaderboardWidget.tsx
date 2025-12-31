/**
 * LeaderboardWidget - Compact leaderboard displays for forum sidebar
 * 
 * Features:
 * - Forum-specific top contributors (karma earned within that forum)
 * - Global top users across all forums
 * - Animated transitions and micro-interactions
 * - Time range filtering (week, month, all-time)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  TrophyIcon,
  SparklesIcon,
  ChevronRightIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid, CheckBadgeIcon } from '@heroicons/react/24/solid';

interface ContributorUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  karma: number;
}

interface Contributor {
  rank: number;
  user: ContributorUser;
  forumKarma: number;
}

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  karma: number;
  isVerified: boolean;
}

type TimeRange = 'week' | 'month' | 'all';

function formatKarma(karma: number): string {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
}

function getRankIcon(rank: number) {
  if (rank === 1) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
        <TrophyIconSolid className="h-3 w-3 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
        <span className="text-xs font-bold text-white">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
        <span className="text-xs font-bold text-white">3</span>
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center">
      <span className="text-xs font-medium text-gray-400">{rank}</span>
    </div>
  );
}

interface UserRowProps {
  rank: number;
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  karma: number;
  isVerified?: boolean;
}

/**
 * Derives the best display identifier for a user with multiple fallback layers.
 * Priority: displayName > username > userId truncated > Anonymous
 */
function deriveUserDisplayInfo(
  displayName: string | null | undefined,
  username: string | null | undefined,
  userId?: string
): { name: string; handle: string; initial: string } {
  const effectiveDisplayName = displayName?.trim() || null;
  const effectiveUsername = username?.trim() || null;
  
  // Determine the primary display name
  const name = effectiveDisplayName || effectiveUsername || (userId ? `User-${userId.slice(0, 8)}` : 'Anonymous');
  
  // Determine the handle (username or fallback)
  const handle = effectiveUsername || (userId ? userId.slice(0, 8) : 'unknown');
  
  // Determine the avatar initial letter
  const initial = (effectiveDisplayName?.[0] || effectiveUsername?.[0] || '?').toUpperCase();
  
  return { name, handle, initial };
}

function UserRow({ rank, userId, username, displayName, avatarUrl, karma, isVerified }: UserRowProps) {
  const { name, handle, initial } = deriveUserDisplayInfo(displayName, username, userId);
  const profilePath = username ? `/u/${username}` : `/users/${userId}`;
  
  return (
    <Link
      to={profilePath}
      className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-dark-600/50 transition-all duration-200 group"
    >
      {getRankIcon(rank)}
      
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-8 h-8 rounded-full object-cover ring-1 ring-dark-600 group-hover:ring-primary-500/50 transition-all"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
          {initial}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
            {name}
          </span>
          {isVerified && (
            <CheckBadgeIcon className="h-4 w-4 text-primary-400 flex-shrink-0" />
          )}
        </div>
        <span className="text-xs text-gray-500">@{handle}</span>
      </div>
      
      <div className="flex items-center gap-1 text-right">
        <SparklesIcon className={`h-3.5 w-3.5 ${rank <= 3 ? 'text-yellow-400' : 'text-gray-500'}`} />
        <span className={`text-sm font-semibold ${rank <= 3 ? 'text-yellow-400' : 'text-gray-300'}`}>
          {formatKarma(karma)}
        </span>
      </div>
    </Link>
  );
}

/**
 * Forum-specific leaderboard showing top contributors within a forum
 */
interface ForumLeaderboardWidgetProps {
  forumId: string;
  forumSlug: string;
  limit?: number;
}

export function ForumLeaderboardWidget({ 
  forumId, 
  forumSlug,
  limit = 5 
}: ForumLeaderboardWidgetProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  useEffect(() => {
    const fetchContributors = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/v1/forums/${forumId}/contributors`, {
          params: { per_page: limit, time_range: timeRange }
        });
        
        const data = response.data?.data || [];
        setContributors(data.map((c: Record<string, unknown>) => ({
          rank: c.rank,
          user: {
            id: (c.user as Record<string, unknown>)?.id,
            username: (c.user as Record<string, unknown>)?.username,
            displayName: (c.user as Record<string, unknown>)?.display_name,
            avatarUrl: (c.user as Record<string, unknown>)?.avatar_url,
            isVerified: (c.user as Record<string, unknown>)?.is_verified,
            karma: (c.user as Record<string, unknown>)?.karma,
          },
          forumKarma: c.forum_karma,
        })));
      } catch (err) {
        console.error('Failed to fetch forum contributors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributors();
  }, [forumId, limit, timeRange]);

  if (isLoading) {
    return (
      <div className="bg-dark-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-dark-600 animate-pulse" />
          <div className="h-4 w-24 bg-dark-600 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-dark-600" />
              <div className="w-8 h-8 rounded-full bg-dark-600" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-20 bg-dark-600 rounded" />
                <div className="h-2 w-12 bg-dark-600 rounded" />
              </div>
              <div className="h-4 w-10 bg-dark-600 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className="bg-dark-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold text-white text-sm">Top Contributors</h3>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          No contributors yet. Be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-dark-700 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
            <TrophyIcon className="h-4 w-4 text-yellow-500" />
          </div>
          <h3 className="font-semibold text-white text-sm">Top Contributors</h3>
        </div>
        
        {/* Time Range Toggle */}
        <div className="flex items-center gap-1">
          {(['week', 'month', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeRange === range
                  ? 'bg-primary-600/30 text-primary-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {range === 'all' ? '∞' : range === 'week' ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </div>

      {/* Contributors List */}
      <div className="space-y-1">
        {contributors.map((contributor) => (
          <UserRow
            key={contributor.user.id}
            rank={contributor.rank}
            userId={contributor.user.id}
            username={contributor.user.username}
            displayName={contributor.user.displayName}
            avatarUrl={contributor.user.avatarUrl}
            karma={contributor.forumKarma}
            isVerified={contributor.user.isVerified}
          />
        ))}
      </div>

      {/* View All Link */}
      <Link
        to={`/forums/${forumSlug}/contributors`}
        className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-dark-600 text-sm text-primary-400 hover:text-primary-300 transition-colors"
      >
        View all contributors
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

/**
 * Global leaderboard showing top users across all forums
 */
interface GlobalLeaderboardWidgetProps {
  limit?: number;
  showTitle?: boolean;
}

export function GlobalLeaderboardWidget({ limit = 5, showTitle = true }: GlobalLeaderboardWidgetProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/v1/users/leaderboard', {
          params: { per_page: limit }
        });
        
        const data = response.data?.data || [];
        setUsers(data.map((u: Record<string, unknown>, index: number) => ({
          rank: (u.rank as number) || index + 1,
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          avatarUrl: u.avatar_url,
          karma: u.karma,
          isVerified: u.is_verified,
        })));
      } catch (err) {
        console.error('Failed to fetch global leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-primary-900/30 to-purple-900/30 rounded-lg p-4 border border-primary-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-dark-600 animate-pulse" />
          <div className="h-4 w-32 bg-dark-600 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-dark-600" />
              <div className="w-8 h-8 rounded-full bg-dark-600" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-20 bg-dark-600 rounded" />
                <div className="h-2 w-12 bg-dark-600 rounded" />
              </div>
              <div className="h-4 w-10 bg-dark-600 rounded" />
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
    <div className="bg-gradient-to-br from-primary-900/30 to-purple-900/30 rounded-lg p-4 border border-primary-500/20">
      {showTitle && (
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20">
            <FireIcon className="h-4 w-4 text-primary-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Global Top Users</h3>
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
            karma={user.karma}
            isVerified={user.isVerified}
          />
        ))}
      </div>

      <Link
        to="/forums/leaderboard"
        className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-primary-500/20 text-sm text-primary-400 hover:text-primary-300 transition-colors"
      >
        View full leaderboard
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

/**
 * Combined widget for sidebar - shows forum-specific when viewing a forum,
 * or global when on the main forums page
 */
interface LeaderboardSidebarProps {
  forumId?: string;
  forumSlug?: string;
}

export function LeaderboardSidebar({ forumId, forumSlug }: LeaderboardSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Forum-specific leaderboard when viewing a forum */}
      {forumId && forumSlug && (
        <ForumLeaderboardWidget
          forumId={forumId}
          forumSlug={forumSlug}
          limit={5}
        />
      )}
      
      {/* Global leaderboard */}
      <GlobalLeaderboardWidget limit={5} />
    </div>
  );
}

export default LeaderboardSidebar;
