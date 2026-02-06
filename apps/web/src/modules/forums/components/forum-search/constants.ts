/**
 * ForumSearch Constants
 *
 * Default values and option configurations.
 */

import {
  MagnifyingGlassIcon,
  ClockIcon,
  FireIcon,
  ChatBubbleLeftIcon,
  HashtagIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import type { SearchFilters, SortOption, TimeRangeOption, ContentTypeOption } from './types';

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: SearchFilters = {
  categories: [],
  sortBy: 'relevance',
  timeRange: 'all',
  type: 'all',
};

/**
 * Sort by options
 */
export const SORT_OPTIONS: SortOption[] = [
  { value: 'relevance', label: 'Relevance', icon: MagnifyingGlassIcon },
  { value: 'date', label: 'Date', icon: ClockIcon },
  { value: 'score', label: 'Score', icon: FireIcon },
  { value: 'comments', label: 'Comments', icon: ChatBubbleLeftIcon },
];

/**
 * Time range options
 */
export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: 'all', label: 'All Time' },
  { value: 'day', label: 'Past Day' },
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' },
  { value: 'year', label: 'Past Year' },
];

/**
 * Content type options
 */
export const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'posts', label: 'Posts', icon: ChatBubbleLeftIcon },
  { value: 'comments', label: 'Comments', icon: HashtagIcon },
  { value: 'users', label: 'Users', icon: UserIcon },
];
