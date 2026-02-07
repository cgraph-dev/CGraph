/**
 * ForumSearch Types
 *
 * Type definitions for the forum search component.
 */

import type { ForumCategory } from '@/modules/forums/store';

/**
 * Individual search result
 */
export interface SearchResult {
  id: string;
  type: 'post' | 'comment' | 'user' | 'forum';
  title: string;
  snippet: string;
  author: {
    username: string;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
  };
  forumName?: string;
  forumSlug?: string;
  score?: number;
  commentCount?: number;
  createdAt: string;
  matchedTerms?: string[];
}

/**
 * Search filters configuration
 */
export interface SearchFilters {
  categories: string[];
  sortBy: 'relevance' | 'date' | 'score' | 'comments';
  timeRange: 'all' | 'day' | 'week' | 'month' | 'year';
  type: 'all' | 'posts' | 'comments' | 'users';
  author?: string;
  hasMedia?: boolean;
  isPinned?: boolean;
}

/**
 * ForumSearch component props
 */
export interface ForumSearchProps {
  forumId?: string;
  categories?: ForumCategory[];
  onSearch?: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
  variant?: 'inline' | 'modal' | 'expanded';
}

/**
 * Search result item props
 */
export interface SearchResultItemProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
  primaryColor: string;
  onClick: () => void;
}

/**
 * Filters panel props
 */
export interface FiltersPanelProps {
  isOpen: boolean;
  filters: SearchFilters;
  categories: ForumCategory[];
  primaryColor: string;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
  onToggleCategory: (categoryId: string) => void;
  onClearFilters: () => void;
}

/**
 * Sort option definition
 */
export interface SortOption {
  value: SearchFilters['sortBy'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Time range option definition
 */
export interface TimeRangeOption {
  value: SearchFilters['timeRange'];
  label: string;
}

/**
 * Content type option definition
 */
export interface ContentTypeOption {
  value: SearchFilters['type'];
  label: string;
  icon: React.ComponentType<{ className?: string }> | null;
}
