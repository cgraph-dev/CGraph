import { Ionicons } from '@expo/vector-icons';

export type LeaderboardCategory = 'karma' | 'xp' | 'streak' | 'messages' | 'posts';
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

export interface LeaderboardUser {
  rank: number;
  previousRank?: number;
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  karma: number;
  level?: number;
  is_verified?: boolean;
  is_premium?: boolean;
}

export interface LeaderboardMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export const CATEGORIES: { key: LeaderboardCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'karma', label: 'Karma', icon: 'heart', color: '#ec4899' },
  { key: 'xp', label: 'XP', icon: 'star', color: '#f59e0b' },
  { key: 'streak', label: 'Streak', icon: 'flame', color: '#ef4444' },
  { key: 'messages', label: 'Messages', icon: 'chatbubble', color: '#3b82f6' },
  { key: 'posts', label: 'Posts', icon: 'document-text', color: '#10b981' },
];

export const TIME_PERIODS: { key: TimePeriod; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'alltime', label: 'All Time' },
];

export function getCategoryColor(category: LeaderboardCategory): string {
  return CATEGORIES.find(c => c.key === category)?.color ?? '#ec4899';
}

export const formatKarma = (karma: number): string => {
  if (karma >= 1000000) return `${(karma / 1000000).toFixed(1)}M`;
  if (karma >= 1000) return `${(karma / 1000).toFixed(1)}K`;
  return karma.toString();
};
