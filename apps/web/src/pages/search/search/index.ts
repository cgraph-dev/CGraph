/**
 * Search module barrel exports
 * @module pages/search/search
 */

// ── Main component ──────────────────────────────────────────────────
export { Search, Search as default } from './page';

// ── Sub-components ──────────────────────────────────────────────────
export { SearchHeader } from './search-header';
export type { SearchHeaderProps } from './search-header';

export { IdSearchBar } from './id-search-bar';
export type { IdSearchBarProps } from './id-search-bar';

export { SearchResults } from './search-results';
export type { SearchResultsProps } from './search-results';

export {
  ResultSection,
  UserResult,
  GroupResult,
  ForumResult,
  PostResult,
  MessageResult,
} from './result-components';

// ── Hooks ───────────────────────────────────────────────────────────
export { useSearch } from './useSearch';
export type { SearchState } from './useSearch';

// ── Types ───────────────────────────────────────────────────────────
export type {
  CategoryDefinition,
  ResultSectionProps,
  UserResultProps,
  GroupResultProps,
  ForumResultProps,
  PostResultProps,
  MessageResultProps,
  IdSearchType,
} from './types';

// ── Constants ───────────────────────────────────────────────────────
export { categories } from './constants';
