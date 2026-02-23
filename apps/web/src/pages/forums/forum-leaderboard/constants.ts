/**
 * Sort options and configuration constants for the forum leaderboard.
 * @module pages/forums/forum-leaderboard/constants
 */
/**
 * Forum Leaderboard Constants
 *
 * Sort options and configuration for the leaderboard.
 */

import {
  FireIcon,
  TrophyIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type { SortOption, RankBadgeConfig } from './types';

/**
 * Available sort options for the leaderboard
 */
export const SORT_OPTIONS: SortOption[] = [
  { value: 'hot', label: 'Hot', icon: FireIcon },
  { value: 'top', label: 'Top All Time', icon: TrophyIcon },
  { value: 'weekly', label: 'Weekly Best', icon: SparklesIcon },
  { value: 'rising', label: 'Rising', icon: ArrowTrendingUpIcon },
  { value: 'new', label: 'New', icon: ClockIcon },
  { value: 'members', label: 'Most Members', icon: UsersIcon },
];

/**
 * Get rank badge styling based on position
 */
export function getRankBadge(rank: number): RankBadgeConfig {
  if (rank === 1)
    return {
      bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      text: 'text-yellow-900',
      emoji: '🥇',
      glow: '0 0 20px rgba(245, 158, 11, 0.5)',
    };
  if (rank === 2)
    return {
      bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
      text: 'text-gray-900',
      emoji: '🥈',
      glow: '0 0 15px rgba(156, 163, 175, 0.4)',
    };
  if (rank === 3)
    return {
      bg: 'bg-gradient-to-br from-orange-400 to-orange-500',
      text: 'text-orange-900',
      emoji: '🥉',
      glow: '0 0 15px rgba(251, 146, 60, 0.4)',
    };
  return { bg: 'bg-dark-600', text: 'text-gray-300', emoji: null, glow: 'none' };
}

/**
 * Get rank color for top forums sidebar
 */
export function getRankColor(rank: number): string {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-gray-300';
  if (rank === 3) return 'text-orange-400';
  return 'text-gray-500';
}
