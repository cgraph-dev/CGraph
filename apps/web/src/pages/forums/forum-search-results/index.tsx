/**
 * Forum Search Results Page
 *
 * Full search results page with search bar, filter chips,
 * results list, and infinite scroll.
 *
 * @module pages/forums/forum-search-results
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForumStore } from '@/modules/forums/store';
import type { ForumSearchFilters } from '@/modules/forums/store/forumStore.types';
import { SearchResultCard } from './search-result-card';
import { SearchFiltersPanel } from './search-filters-panel';

function ForumSearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    searchResults,
    searchLoading,
    searchHasMore,
    searchQuery,
    searchFilters,
    searchForums,
    searchMore,
    clearSearch,
  } = useForumStore();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read URL params on mount
  const urlQuery = searchParams.get('q') ?? '';
  const urlType = searchParams.get('type') as ForumSearchFilters['type'] | null;
  const urlSort = searchParams.get('sort') as ForumSearchFilters['sort'] | null;
  const urlDateFrom = searchParams.get('date_from') ?? undefined;
  const urlDateTo = searchParams.get('date_to') ?? undefined;

  // Trigger search from URL params on mount / param change
  useEffect(() => {
    if (urlQuery) {
      const filters: ForumSearchFilters = {};
      if (urlType) filters.type = urlType;
      if (urlSort) filters.sort = urlSort;
      if (urlDateFrom) filters.dateFrom = urlDateFrom;
      if (urlDateTo) filters.dateTo = urlDateTo;
      searchForums(urlQuery, filters);
    }
    return () => {
      clearSearch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, urlType, urlSort, urlDateFrom, urlDateTo]);

  // Infinite scroll observer
  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && searchHasMore && !searchLoading) {
          searchMore();
        }
      });
      if (node) observerRef.current.observe(node);
      sentinelRef.current = node;
    },
    [searchHasMore, searchLoading, searchMore]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (searchFilters.type && searchFilters.type !== 'all') params.set('type', searchFilters.type);
    if (searchFilters.sort) params.set('sort', searchFilters.sort);
    if (searchFilters.dateFrom) params.set('date_from', searchFilters.dateFrom);
    if (searchFilters.dateTo) params.set('date_to', searchFilters.dateTo);
    setSearchParams(params);
  };

  const handleFiltersChange = (newFilters: ForumSearchFilters) => {
    const q = searchQuery || inputRef.current?.value.trim() || '';
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (newFilters.type && newFilters.type !== 'all') params.set('type', newFilters.type);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    if (newFilters.dateFrom) params.set('date_from', newFilters.dateFrom);
    if (newFilters.dateTo) params.set('date_to', newFilters.dateTo);
    setSearchParams(params);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Search Forums</h1>
        {searchQuery && !searchLoading && (
          <p className="mt-1 text-sm text-gray-400">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          defaultValue={urlQuery}
          placeholder="Search threads, posts, comments…"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Search
        </button>
      </form>

      {/* Filters */}
      <SearchFiltersPanel
        filters={searchFilters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Results */}
      <div className="space-y-3">
        {searchResults.map((result) => (
          <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
        ))}

        {/* Loading indicator */}
        {searchLoading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* Empty state */}
        {!searchLoading && searchQuery && searchResults.length === 0 && (
          <div className="py-16 text-center">
            <div className="mb-3 text-4xl">🔍</div>
            <h3 className="text-lg font-semibold text-white">No results found</h3>
            <p className="mt-1 text-sm text-gray-400">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}

        {/* Initial state */}
        {!searchLoading && !searchQuery && searchResults.length === 0 && (
          <div className="py-16 text-center">
            <div className="mb-3 text-4xl">💬</div>
            <h3 className="text-lg font-semibold text-white">Search the forums</h3>
            <p className="mt-1 text-sm text-gray-400">
              Find threads, posts, and comments across all forums.
            </p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {searchHasMore && <div ref={sentinelCallback} className="h-4" />}
      </div>
    </div>
  );
}

export default ForumSearchResults;
