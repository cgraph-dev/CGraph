/**
 * Forum Store — Utility Functions
 *
 * Shared helpers used across forum store action slices.
 *
 * @module modules/forums/store/forumStore.utils
 */

import { ensureArray, ensureObject } from '@/lib/apiUtils';
import type { Forum } from './forumStore.types';

/** Map raw API response data into a typed Forum object. */
export function mapForumFromApi(data: Record<string, unknown>): Forum {
  const owner = data.owner as Record<string, unknown> | null;
  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    description: (data.description as string | null) || null,
    iconUrl: (data.icon as string | null) || null,
    bannerUrl: (data.banner as string | null) || null,
    customCss: null,
    isNsfw: (data.is_nsfw as boolean) || false,
    isPrivate: (data.is_private as boolean) || false,
    isPublic: !(data.is_private as boolean),
    memberCount: (data.member_count as number) || 0,
    score: (data.score as number) || 0,
    upvotes: (data.upvotes as number) || 0,
    downvotes: (data.downvotes as number) || 0,
    hotScore: (data.hot_score as number) || 0,
    weeklyScore: (data.weekly_score as number) || 0,
    featured: (data.featured as boolean) || false,
    userVote: ((data.user_vote as number) || 0) as 1 | -1 | 0,
    categories: ensureArray(data.categories, 'categories'),
    moderators: [],
    isSubscribed: (data.is_subscribed as boolean) || false,
    isMember: (data.is_member as boolean) || false,
    ownerId: (owner?.id as string | null) || null,
    createdAt: data.created_at as string,
  };
}

// Re-export API helpers for use in slices
export { api } from '@/lib/api';
export { ensureArray, ensureObject };
