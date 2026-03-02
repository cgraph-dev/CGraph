/**
 * LeaderboardWidget Constants
 *
 * Configuration for leaderboard types and time periods.
 */

import { TrophyIcon, ChartBarIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import type { LeaderboardTypeOption, TimePeriodOption } from './types';

/**
 * Rank colors for top 3
 */
export const RANK_COLORS: Record<number, string> = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

/**
 * Medal emoji icons for top 3 ranks
 */
export const MEDAL_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

/**
 * Available leaderboard types
 */
export const LEADERBOARD_TYPES: LeaderboardTypeOption[] = [
  { value: 'xp', label: 'XP', icon: SparklesIcon },
  { value: 'karma', label: 'Karma', icon: StarIcon },
  { value: 'messages', label: 'Messages', icon: ChartBarIcon },
  { value: 'posts', label: 'Posts', icon: ChartBarIcon },
  { value: 'achievements', label: 'Achievements', icon: TrophyIcon },
  { value: 'referrals', label: 'Referrals', icon: UserGroupIcon },
];

/**
 * Available time periods
 */
export const TIME_PERIODS: TimePeriodOption[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'allTime', label: 'All Time' },
];
