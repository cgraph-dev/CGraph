/**
 * Shared types and defaults for search screen components.
 *
 * @module screens/search/SearchScreen/components/search-types
 */

export interface SearchFilters {
  verifiedOnly: boolean;
  premiumOnly: boolean;
  hasAvatar: boolean;
  dateRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'relevance' | 'recent' | 'popular';
}

export const defaultFilters: SearchFilters = {
  verifiedOnly: false,
  premiumOnly: false,
  hasAvatar: false,
  dateRange: 'all',
  sortBy: 'relevance',
};
