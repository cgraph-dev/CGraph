/**
 * Forum Leaderboard Types
 *
 * Type definitions for the forum leaderboard component.
 */

import type { Forum } from '@/stores/forumStore';

/**
 * Sort options for the leaderboard
 */
export type LeaderboardSort = 'hot' | 'top' | 'new' | 'rising' | 'weekly' | 'members';

/**
 * Sort option configuration
 */
export interface SortOption {
  value: LeaderboardSort;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Props for ForumLeaderboardCard component
 */
export interface ForumLeaderboardCardProps {
  forum: Forum;
  rank: number;
  onVote: (forum: Forum, value: 1 | -1) => void;
  isAuthenticated: boolean;
}

/**
 * Props for TopForumCard component
 */
export interface TopForumCardProps {
  forum: Forum;
  rank: number;
}

/**
 * Rank badge styling configuration
 */
export interface RankBadgeConfig {
  bg: string;
  text: string;
  emoji: string | null;
  glow: string;
}
