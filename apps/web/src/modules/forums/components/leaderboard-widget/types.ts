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
  pulse: number;
}

export interface Contributor {
  rank: number;
  user: ContributorUser;
  forumPulse: number;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  pulse: number;
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
  pulse: number;
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
