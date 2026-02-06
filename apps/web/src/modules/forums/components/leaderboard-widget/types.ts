/**
 * LeaderboardWidget - Type definitions
 */

export interface ContributorUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  isVerified: boolean;
  karma: number;
}

export interface Contributor {
  rank: number;
  user: ContributorUser;
  forumKarma: number;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  karma: number;
  isVerified: boolean;
}

export type TimeRange = 'week' | 'month' | 'all';

export interface UserRowProps {
  rank: number;
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  karma: number;
  isVerified?: boolean;
}

export interface ForumLeaderboardWidgetProps {
  forumId: string;
  forumSlug: string;
  limit?: number;
}

export interface GlobalLeaderboardWidgetProps {
  limit?: number;
  showTitle?: boolean;
}

export interface LeaderboardSidebarProps {
  forumId?: string;
  forumSlug?: string;
}
