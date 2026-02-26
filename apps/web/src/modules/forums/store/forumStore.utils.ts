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
   
  const owner = data.owner as Record<string, unknown> | null; // safe downcast – API response field
  return {
     
    id: data.id as string, // type assertion: API response field
     
    name: data.name as string, // type assertion: API response field
     
    slug: data.slug as string, // type assertion: API response field
     
    description: (data.description as string | null) || null, // type assertion: API response field
     
    iconUrl: (data.icon as string | null) || null, // type assertion: API response field
     
    bannerUrl: (data.banner as string | null) || null, // type assertion: API response field
    customCss: null,
     
    isNsfw: (data.is_nsfw as boolean) || false, // type assertion: API response field
     
    isPrivate: (data.is_private as boolean) || false, // type assertion: API response field
     
    isPublic: !(data.is_private as boolean), // type assertion: API response field
     
    memberCount: (data.member_count as number) || 0, // type assertion: API response field
     
    score: (data.score as number) || 0, // type assertion: API response field
     
    upvotes: (data.upvotes as number) || 0, // type assertion: API response field
     
    downvotes: (data.downvotes as number) || 0, // type assertion: API response field
     
    hotScore: (data.hot_score as number) || 0, // type assertion: API response field
     
    weeklyScore: (data.weekly_score as number) || 0, // type assertion: API response field
     
    featured: (data.featured as boolean) || false, // type assertion: API response field
     
    userVote: ((data.user_vote as number) || 0) as 1 | -1 | 0, // type assertion: API vote value constrained to valid vote values
    categories: ensureArray(data.categories, 'categories'),
    moderators: [],
     
    isSubscribed: (data.is_subscribed as boolean) || false, // type assertion: API response field
     
    isMember: (data.is_member as boolean) || false, // type assertion: API response field
     
    ownerId: (owner?.id as string | null) || null, // type assertion: API response field
     
    createdAt: data.created_at as string, // type assertion: API response field
  };
}

// Re-export API helpers for use in slices
export { api } from '@/lib/api';
export { ensureArray, ensureObject };
