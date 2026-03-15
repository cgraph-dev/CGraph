/**
 * Search Filters Panel
 *
 * Type toggle chips, sort selector, and date range
 * for filtering forum search results.
 *
 * @module pages/forums/forum-search-results/search-filters-panel
 */

import type { ForumSearchFilters } from '@/modules/forums/store/forumStore.types';

const TYPE_OPTIONS: { value: ForumSearchFilters['type']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'thread', label: 'Threads' },
  { value: 'post', label: 'Posts' },
  { value: 'comment', label: 'Comments' },
];

const SORT_OPTIONS: { value: NonNullable<ForumSearchFilters['sort']>; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_votes', label: 'Most Votes' },
];

interface SearchFiltersPanelProps {
  filters: ForumSearchFilters;
  onFiltersChange: (filters: ForumSearchFilters) => void;
}

/** Description. */
/** Search Filters Panel component. */
export function SearchFiltersPanel({ filters, onFiltersChange }: SearchFiltersPanelProps) {
  const updateFilter = <K extends keyof ForumSearchFilters>(
    key: K,
    value: ForumSearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type Chips */}
      <div className="flex gap-1.5">
        {TYPE_OPTIONS.map((option) => {
          const isActive = (filters.type ?? 'all') === option.value;
          return (
            <button
              key={option.value}
              onClick={() => updateFilter('type', option.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Sort Selector */}
      <select
        value={filters.sort ?? 'relevance'}
         
        onChange={(e) => updateFilter('sort', e.target.value as ForumSearchFilters['sort'])}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 outline-none focus:border-blue-500"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-500"
          placeholder="From"
        />
        <span className="text-xs text-gray-500">—</span>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-500"
          placeholder="To"
        />
      </div>
    </div>
  );
}

export default SearchFiltersPanel;
