/**
 * Search module barrel exports
 * @module pages/search/search
 */

// ── Main component ──────────────────────────────────────────────────
export { Search, Search as default } from './page';

// ── Sub-components ──────────────────────────────────────────────────
export { SearchHeader } from './SearchHeader';
export type { SearchHeaderProps } from './SearchHeader';

export { IdSearchBar } from './IdSearchBar';
export type { IdSearchBarProps } from './IdSearchBar';

export { SearchResults } from './SearchResults';
export type { SearchResultsProps } from './SearchResults';

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
