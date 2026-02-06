/**
 * Advanced Search constants - Default filter values
 * @module modules/search/components/advanced-search
 */
import type { AdvancedSearchFilters } from './types';

export const defaultFilters: AdvancedSearchFilters = {
  keywords: '',
  author: '',
  dateRange: 'any',
  searchIn: 'all',
  forumId: null,
  includeSubforums: true,
  contentType: 'all',
  showClosed: true,
  showSticky: true,
  showNormal: true,
  sortBy: 'relevance',
  sortOrder: 'desc',
  resultsPerPage: 25,
};
