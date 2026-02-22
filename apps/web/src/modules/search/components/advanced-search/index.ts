/**
 * Advanced Search Module
 *
 * MyBB-style advanced search panel with keyword, author, date range,
 * forum scope, content type, and sort filters. Features collapsible
 * filter panel with real-time search.
 *
 * @module modules/search/components/advanced-search
 */

// Main component
export { default as AdvancedSearch, default } from './advanced-search';

// Sub-components
export { SearchBar } from './search-bar';
export { FilterPanel } from './filter-panel';

// Types
export type { AdvancedSearchFilters, AdvancedSearchProps } from './types';

// Constants
export { defaultFilters } from './constants';
