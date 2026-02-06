/**
 * LeaderboardWidget Types
 *
 * Type definitions for the leaderboard widget component.
 */

/**
 * Leaderboard entry data
 */
export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  level: number;
  score: number;
  badges?: string[];
  isCurrentUser?: boolean;
}

/**
 * Leaderboard type options
 */
export type LeaderboardType = 'xp' | 'karma' | 'messages' | 'posts' | 'achievements' | 'referrals';

/**
 * Time period options
 */
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

/**
 * Display variant
 */
export type WidgetVariant = 'default' | 'compact' | 'sidebar';

/**
 * LeaderboardWidget component props
 */
export interface LeaderboardWidgetProps {
  entries: LeaderboardEntry[];
  leaderboardType?: LeaderboardType;
  timePeriod?: TimePeriod;
  onTimePeriodChange?: (period: TimePeriod) => void;
  onTypeChange?: (type: string) => void;
  onUserClick?: (userId: string) => void;
  currentUserId?: string;
  showPodium?: boolean;
  showFilters?: boolean;
  pageSize?: number;
  isLoading?: boolean;
  variant?: WidgetVariant;
  className?: string;
}

/**
 * LeaderboardEntry component props
 */
export interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  index: number;
  leaderboardType: LeaderboardType;
  primaryColor: string;
  onUserClick?: (userId: string) => void;
}

/**
 * Podium component props
 */
export interface PodiumProps {
  entries: LeaderboardEntry[];
  onUserClick?: (userId: string) => void;
}

/**
 * Type selector item
 */
export interface LeaderboardTypeOption {
  value: LeaderboardType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Time period selector item
 */
export interface TimePeriodOption {
  value: TimePeriod;
  label: string;
}
