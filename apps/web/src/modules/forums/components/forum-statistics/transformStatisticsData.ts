/**
 * Transforms raw API statistics data into typed ForumStats shape.
 * @module modules/forums/components/forum-statistics/transformStatisticsData
 */
import type { ForumStats } from '@/modules/forums/components/forum-statistics/forum-statistics.types';
import { isRecord } from '@/lib/apiUtils';

/**
 * Transforms raw API statistics data into the typed ForumStats shape.
 */
export function transformStatisticsData(data: Record<string, unknown>): ForumStats {
  const newestMember = isRecord(data.newest_member) ? data.newest_member : null;
  const membersOnline = Array.isArray(data.members_online) ? data.members_online : [];

  return {
    totalThreads: Number(data.total_threads) || 0,
    totalPosts: Number(data.total_posts) || 0,
    totalMembers: Number(data.total_members) || 0,
    newestMember: newestMember
      ? {
          id: String(newestMember.id),
          username: String(newestMember.username),
          displayName: newestMember.display_name ? String(newestMember.display_name) : null,
        }
      : null,
    postsToday: Number(data.posts_today) || 0,
    threadsToday: Number(data.threads_today) || 0,
    newMembersToday: Number(data.new_members_today) || 0,
    usersOnline: Number(data.users_online) || 0,
    guestsOnline: Number(data.guests_online) || 0,
    membersOnline: membersOnline.filter(isRecord).map((m) => ({
      id: String(m.id),
      username: String(m.username),
      displayName: m.display_name ? String(m.display_name) : null,
    })),
    mostUsersOnline: Number(data.most_users_online) || 0,
    mostUsersOnlineDate: data.most_users_online_date ? String(data.most_users_online_date) : null,
    activeUsers24h: Number(data.active_users_24h) || 0,
  };
}

/** Refresh interval for statistics polling (ms). */
export const STATS_REFRESH_INTERVAL = 60_000;

/** Maximum online members displayed before truncation. */
export const MAX_VISIBLE_ONLINE_MEMBERS = 20;
