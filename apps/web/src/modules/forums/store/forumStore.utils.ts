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
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const owner = data.owner as Record<string, unknown> | null; // safe downcast – API response field
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: data.id as string, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    name: data.name as string, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    slug: data.slug as string, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    description: (data.description as string | null) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    iconUrl: (data.icon as string | null) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    bannerUrl: (data.banner as string | null) || null, // type assertion: API response field
    customCss: null,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isNsfw: (data.is_nsfw as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isPrivate: (data.is_private as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isPublic: !(data.is_private as boolean), // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    memberCount: (data.member_count as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    score: (data.score as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    upvotes: (data.upvotes as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    downvotes: (data.downvotes as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    hotScore: (data.hot_score as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    weeklyScore: (data.weekly_score as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    featured: (data.featured as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    userVote: ((data.user_vote as number) || 0) as 1 | -1 | 0, // type assertion: API vote value constrained to valid vote values
    categories: ensureArray(data.categories, 'categories'),
    moderators: [],

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isSubscribed: (data.is_subscribed as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isMember: (data.is_member as boolean) || false, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ownerId: (owner?.id as string | null) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    createdAt: data.created_at as string, // type assertion: API response field
  };
}

// Re-export API helpers for use in slices
export { api } from '@/lib/api';
export { ensureArray, ensureObject };
