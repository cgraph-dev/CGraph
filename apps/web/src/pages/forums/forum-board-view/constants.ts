/**
 * Constants for forum board view configuration.
 * @module pages/forums/forum-board-view/constants
 */
import type { MemberSortOption } from './types';

/**
 * Role colors for member badges
 */
export const ROLE_COLORS = {
  owner: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  moderator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  member: 'bg-dark-600 text-gray-400 border-dark-500',
} as const;

/**
 * Sort options for the members dropdown
 */
export const MEMBER_SORT_OPTIONS: Array<{ value: MemberSortOption; label: string }> = [
  { value: 'recent', label: 'Recently Joined' },
  { value: 'reputation', label: 'Reputation' },
  { value: 'posts', label: 'Most Posts' },
  { value: 'alphabetical', label: 'A-Z' },
];

/**
 * Loading skeleton counts
 */
export const SKELETON_COUNTS = {
  boards: 3,
  threads: 5,
  members: 5,
} as const;
