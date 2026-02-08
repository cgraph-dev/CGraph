/**
 * Advanced Search Module Types
 *
 * Type definitions for the MyBB-style advanced search components.
 *
 * @module modules/search/components/advanced-search
 */

/** Advanced search filter state — MyBB-style */
export interface AdvancedSearchFilters {
  // Query terms
  keywords: string;
  author: string;

  // Date range
  dateRange: 'any' | 'day' | 'week' | 'month' | 'year' | 'custom';
  dateFrom?: string;
  dateTo?: string;

  // Search scope
  searchIn: 'all' | 'titles' | 'content' | 'firstPost';

  // Forum filter
  forumId: string | null;
  includeSubforums: boolean;

  // Content type
  contentType: 'all' | 'threads' | 'posts';

  // Thread status
  showClosed: boolean;
  showSticky: boolean;
  showNormal: boolean;

  // Results
  sortBy: 'relevance' | 'date' | 'author' | 'replies' | 'views';
  sortOrder: 'desc' | 'asc';
  resultsPerPage: 10 | 25 | 50;

  // Post count
  minReplies?: number;
  maxReplies?: number;

  // Has attachments/poll
  hasAttachments?: boolean;
  hasPoll?: boolean;
}

export interface Forum {
  id: string;
  name: string;
}

/** Shared helper – any sub-component that reads & mutates filters */
export interface FilterUpdateFn {
  <K extends keyof AdvancedSearchFilters>(key: K, value: AdvancedSearchFilters[K]): void;
}

export interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters) => void;
  isLoading?: boolean;
  className?: string;
  /** Start expanded */
  defaultExpanded?: boolean;
}
