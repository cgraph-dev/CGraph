/**
 * SearchResults Component
 *
 * Displays search results, recent searches, or empty states
 */

import { ClockIcon } from '@heroicons/react/24/outline';
import type { SearchResultsProps } from './types';
import { SearchResultCard } from './SearchResultCard';

/**
 * Search results list with loading and empty states
 */
export function SearchResults({
  isLoading,
  searchQuery,
  results,
  recentSearches,
  onJumpToMessage,
  onRecentSearchClick,
}: SearchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex h-32 items-center justify-center">
          <div className="border-accent-500 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Results found
  if (searchQuery && results.length > 0) {
    return (
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        <p className="mb-2 text-xs text-white/50">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </p>
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} onJumpToMessage={onJumpToMessage} />
        ))}
      </div>
    );
  }

  // No results
  if (searchQuery && results.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="py-8 text-center">
          <p className="text-white/60">No messages found</p>
          <p className="mt-1 text-sm text-white/40">Try different keywords or adjust filters</p>
        </div>
      </div>
    );
  }

  // Recent searches (no active query)
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {recentSearches.length > 0 ? (
        <div>
          <p className="mb-3 flex items-center text-xs text-white/50">
            <ClockIcon className="mr-1 h-3.5 w-3.5" />
            Recent Searches
          </p>
          <div className="space-y-1">
            {recentSearches.map((term, index) => (
              <button
                key={index}
                onClick={() => onRecentSearchClick(term)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/5"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-white/40">Start typing to search messages</p>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
