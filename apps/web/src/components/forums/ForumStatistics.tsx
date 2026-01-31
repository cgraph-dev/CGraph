import React, { useEffect, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UsersIcon,
  UserIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumStatistics');

/**
 * ForumStatistics Component
 *
 * MyBB-style forum statistics panel showing:
 * - Total threads, posts, members
 * - Newest member
 * - Most users online
 * - Currently online users
 * - Posts today
 * - Active users
 */

interface ForumStats {
  // Totals
  totalThreads: number;
  totalPosts: number;
  totalMembers: number;

  // Newest
  newestMember: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;

  // Activity
  postsToday: number;
  threadsToday: number;
  newMembersToday: number;

  // Online
  usersOnline: number;
  guestsOnline: number;
  membersOnline: {
    id: string;
    username: string;
    displayName: string | null;
  }[];
  mostUsersOnline: number;
  mostUsersOnlineDate: string | null;

  // Active
  activeUsers24h: number;
}

interface ForumStatisticsProps {
  forumId?: string; // If provided, show stats for specific forum
  showOnlineList?: boolean;
  showRecordStats?: boolean;
  compact?: boolean;
  className?: string;
}

export function ForumStatistics({
  forumId,
  showOnlineList = true,
  showRecordStats = true,
  compact = false,
  className = '',
}: ForumStatisticsProps) {
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      setError(null);

      try {
        const endpoint = forumId ? `/api/v1/forums/${forumId}/statistics` : '/api/v1/statistics';

        const response = await api.get(endpoint);
        const data = response.data.statistics || response.data;

        setStats({
          totalThreads: data.total_threads || 0,
          totalPosts: data.total_posts || 0,
          totalMembers: data.total_members || 0,
          newestMember: data.newest_member
            ? {
                id: data.newest_member.id,
                username: data.newest_member.username,
                displayName: data.newest_member.display_name || null,
              }
            : null,
          postsToday: data.posts_today || 0,
          threadsToday: data.threads_today || 0,
          newMembersToday: data.new_members_today || 0,
          usersOnline: data.users_online || 0,
          guestsOnline: data.guests_online || 0,
          membersOnline: (data.members_online || []).map((m: Record<string, unknown>) => ({
            id: m.id as string,
            username: m.username as string,
            displayName: (m.display_name as string) || null,
          })),
          mostUsersOnline: data.most_users_online || 0,
          mostUsersOnlineDate: data.most_users_online_date || null,
          activeUsers24h: data.active_users_24h || 0,
        });
      } catch (err) {
        logger.error('[ForumStatistics] Failed to fetch:', err);
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();

    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [forumId]);

  if (isLoading) {
    return (
      <div className={`animate-pulse rounded-lg bg-gray-100 p-4 dark:bg-gray-800 ${className}`}>
        <div className="mb-3 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className={`rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400 ${className}`}
      >
        {error || 'Statistics unavailable'}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-6 text-sm ${className}`}>
        <StatBadge
          icon={<DocumentTextIcon className="h-4 w-4" />}
          label="Threads"
          value={stats.totalThreads}
        />
        <StatBadge
          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
          label="Posts"
          value={stats.totalPosts}
        />
        <StatBadge
          icon={<UsersIcon className="h-4 w-4" />}
          label="Members"
          value={stats.totalMembers}
        />
        <StatBadge
          icon={<UserIcon className="h-4 w-4" />}
          label="Online"
          value={stats.usersOnline + stats.guestsOnline}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <ChartBarIcon className="h-5 w-5 text-blue-500" />
          Forum Statistics
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={<DocumentTextIcon className="h-6 w-6" />}
            label="Threads"
            value={stats.totalThreads}
            subValue={`+${stats.threadsToday} today`}
            iconColor="text-blue-500"
          />
          <StatCard
            icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
            label="Posts"
            value={stats.totalPosts}
            subValue={`+${stats.postsToday} today`}
            iconColor="text-green-500"
          />
          <StatCard
            icon={<UsersIcon className="h-6 w-6" />}
            label="Members"
            value={stats.totalMembers}
            subValue={`+${stats.newMembersToday} today`}
            iconColor="text-purple-500"
          />
          <StatCard
            icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
            label="Active (24h)"
            value={stats.activeUsers24h}
            iconColor="text-orange-500"
          />
        </div>

        {/* Online Now */}
        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
            <span className="font-medium text-gray-900 dark:text-white">
              {stats.usersOnline + stats.guestsOnline} Users Online
            </span>
            <span className="text-sm text-gray-500">
              ({stats.usersOnline} members, {stats.guestsOnline} guests)
            </span>
          </div>

          {/* Online Members List */}
          {showOnlineList && stats.membersOnline.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {stats.membersOnline.slice(0, 20).map((member) => (
                <a
                  key={member.id}
                  href={`/profile/${member.username}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {member.displayName || member.username}
                </a>
              ))}
              {stats.membersOnline.length > 20 && (
                <span className="text-sm text-gray-500">
                  and {stats.membersOnline.length - 20} more...
                </span>
              )}
            </div>
          )}

          {/* Record Stats */}
          {showRecordStats && stats.mostUsersOnline > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>
                Record:{' '}
                <strong className="text-gray-700 dark:text-gray-300">
                  {stats.mostUsersOnline}
                </strong>{' '}
                users online
                {stats.mostUsersOnlineDate && (
                  <span> on {new Date(stats.mostUsersOnlineDate).toLocaleDateString()}</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Newest Member */}
        {stats.newestMember && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Welcome our newest member:</span>
              <a
                href={`/profile/${stats.newestMember.username}`}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {stats.newestMember.displayName || stats.newestMember.username}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue?: string;
  iconColor?: string;
}

function StatCard({ icon, label, value, subValue, iconColor = 'text-gray-500' }: StatCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
      <div className={iconColor}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">{label}</div>
        {subValue && (
          <div className="mt-1 text-xs text-green-600 dark:text-green-400">{subValue}</div>
        )}
      </div>
    </div>
  );
}

// Stat Badge Component (for compact view)
interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatBadge({ icon, label, value }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
      {icon}
      <span className="font-medium">{value.toLocaleString()}</span>
      <span className="text-gray-400">{label}</span>
    </div>
  );
}

export default ForumStatistics;
