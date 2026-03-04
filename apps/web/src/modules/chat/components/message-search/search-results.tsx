/**
 * SearchResults Component
 *
 * Displays search results, recent searches, or empty states
 */

import { motion } from 'motion/react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { MessageSkeleton } from '@/components/ui/skeletons';
import type { SearchResultsProps } from './types';
import { SearchResultCard } from './search-result-card';
import { tweens, staggerConfigs } from '@/lib/animation-presets';

const resultContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: staggerConfigs.fast.staggerChildren },
  },
};

const resultItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

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
  // Loading state — skeleton shimmer
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <MessageSkeleton count={4} alternating={false} />
      </div>
    );
  }

  // Results found
  if (searchQuery && results.length > 0) {
    return (
      <motion.div
        className="flex-1 space-y-2 overflow-y-auto p-4"
        variants={resultContainer}
        initial="hidden"
        animate="show"
      >
        <p className="mb-2 text-xs text-white/50">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </p>
        {results.map((result) => (
          <motion.div key={result.id} variants={resultItem}>
            <SearchResultCard result={result} onJumpToMessage={onJumpToMessage} />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // No results
  if (searchQuery && results.length === 0) {
    return (
      <motion.div
        className="flex-1 overflow-y-auto p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={tweens.brisk}
      >
        <div className="py-8 text-center">
          <p className="text-white/60">No messages found</p>
          <p className="mt-1 text-sm text-white/40">Try different keywords or adjust filters</p>
        </div>
      </motion.div>
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
