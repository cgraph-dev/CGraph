/**
 * UserLeaderboard Types
 *
 * Type definitions for the user leaderboard page.
 */

/**
 * Leaderboard user display data
 */
export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  karma: number;
  isVerified: boolean;
}

/**
 * Pagination metadata
 */
export interface LeaderboardMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * API response type for leaderboard users
 */
export interface LeaderboardApiUser {
  rank: number;
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  avatar_border_id?: string;
  avatarBorderId?: string;
  karma: number;
  is_verified?: boolean;
}

/**
 * UserLeaderboardCard component props
 */
export interface UserLeaderboardCardProps {
  user: LeaderboardUser;
  index?: number;
}

/**
 * Top3Spotlight component props
 */
export interface Top3SpotlightProps {
  users: LeaderboardUser[];
}

/**
 * Pagination component props
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
