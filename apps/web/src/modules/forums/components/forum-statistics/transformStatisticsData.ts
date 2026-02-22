import type { ForumStats } from '@/modules/forums/components/forum-statistics/forum-statistics.types';

/**
 * Transforms raw API statistics data into the typed ForumStats shape.
 */
export function transformStatisticsData(data: Record<string, unknown>): ForumStats {
  return {
    totalThreads: (data.total_threads as number) || 0,
    totalPosts: (data.total_posts as number) || 0,
    totalMembers: (data.total_members as number) || 0,
    newestMember: data.newest_member
      ? {
          id: (data.newest_member as Record<string, unknown>).id as string,
          username: (data.newest_member as Record<string, unknown>).username as string,
          displayName:
            ((data.newest_member as Record<string, unknown>).display_name as string) || null,
        }
      : null,
    postsToday: (data.posts_today as number) || 0,
    threadsToday: (data.threads_today as number) || 0,
    newMembersToday: (data.new_members_today as number) || 0,
    usersOnline: (data.users_online as number) || 0,
    guestsOnline: (data.guests_online as number) || 0,
    membersOnline: ((data.members_online as Record<string, unknown>[]) || []).map(
      (m: Record<string, unknown>) => ({
        id: m.id as string,
        username: m.username as string,
        displayName: (m.display_name as string) || null,
      })
    ),
    mostUsersOnline: (data.most_users_online as number) || 0,
    mostUsersOnlineDate: (data.most_users_online_date as string) || null,
    activeUsers24h: (data.active_users_24h as number) || 0,
  };
}

/** Refresh interval for statistics polling (ms). */
export const STATS_REFRESH_INTERVAL = 60_000;

/** Maximum online members displayed before truncation. */
export const MAX_VISIBLE_ONLINE_MEMBERS = 20;
