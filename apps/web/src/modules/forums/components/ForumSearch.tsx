/**
 * ForumSearch Component
 *
 * Advanced search functionality for forums with:
 * - Real-time search suggestions
 * - Category/tag filtering
 * - Date range filtering
 * - Sort options (relevance, date, score, comments)
 * - Search history
 * - Advanced filters panel
 * - Keyboard navigation
 *
 * Modularized into forum-search/ directory:
 * - types.ts: SearchResult, SearchFilters, prop interfaces
 * - constants.ts: DEFAULT_FILTERS, sort/time/type options
 * - useSearchHistory.ts: localStorage history hook
 * - SearchResultItem.tsx: Individual result display
 * - FiltersPanel.tsx: Expandable filters
 * - SearchResults.tsx: Results dropdown
 * - ForumSearch.tsx: Main component
 *
 * @version 1.0.0
 * @since v0.9.0
 */
export { default } from './forum-search';
export * from './forum-search';
