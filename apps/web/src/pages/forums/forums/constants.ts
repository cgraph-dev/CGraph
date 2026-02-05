/**
 * Constants for Forums page
 * @module pages/forums/forums/constants
 */

import { FireIcon, ClockIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import type { SortOption, TimeRangeOption } from './types';

/**
 * Available sort options for forum posts
 */
export const sortOptions: readonly SortOption[] = [
  { value: 'hot', label: 'Hot', icon: FireIcon },
  { value: 'new', label: 'New', icon: ClockIcon },
  { value: 'top', label: 'Top', icon: ArrowTrendingUpIcon },
] as const;

/**
 * Available time range options for "Top" sort
 */
export const timeRangeOptions: readonly TimeRangeOption[] = [
  { value: 'hour', label: 'Past Hour' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
] as const;

/**
 * Get CSS class for vote score display based on user's vote.
 */
export function getVoteScoreClass(vote: 1 | -1 | null): string {
  switch (vote) {
    case 1:
      return 'text-orange-500 bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent';
    case -1:
      return 'text-blue-500 bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent';
    default:
      return 'text-white';
  }
}
