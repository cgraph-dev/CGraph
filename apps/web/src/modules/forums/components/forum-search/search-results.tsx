/**
 * SearchResults Component
 *
 * Dropdown showing search results, loading state, and suggestions.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import { staggerConfigs } from '@/lib/animation-presets/presets';

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
import { GlassCard } from '@/shared/components/ui';
import { SearchResultItem } from './search-result-item';
import type { SearchResult } from './types';

interface SearchResultsProps {
  isOpen: boolean;
  isLoading: boolean;
  query: string;
  results: SearchResult[];
  suggestions: string[];
  selectedIndex: number;
  primaryColor: string;
  onResultClick: (result: SearchResult) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function SearchResults({
  isOpen,
  isLoading,
  query,
  results,
  suggestions,
  selectedIndex,
  primaryColor,
  onResultClick,
  onSuggestionClick,
}: SearchResultsProps) {
  const showDropdown = isOpen && (query.length >= 2 || suggestions.length > 0);

  return (
    <AnimatePresence>
      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-0 right-0 z-50 mt-2"
        >
          <GlassCard variant="frosted" className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <LoadingState primaryColor={primaryColor} />
            ) : results.length > 0 ? (
              <motion.div className="divide-y divide-dark-700" variants={resultContainer} initial="hidden" animate="show">
                {results.map((result, index) => (
                  <motion.div key={result.id} variants={resultItem}>
                    <SearchResultItem
                      result={result}
                      index={index}
                      isSelected={index === selectedIndex}
                      primaryColor={primaryColor}
                      onClick={() => onResultClick(result)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : query.length >= 2 ? (
              <NoResultsState query={query} />
            ) : suggestions.length > 0 ? (
              <SuggestionsState suggestions={suggestions} onSuggestionClick={onSuggestionClick} />
            ) : null}
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Loading spinner state
 */
function LoadingState({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="p-4 text-center text-gray-400">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="mx-auto h-6 w-6 rounded-full border-2 border-t-transparent"
        style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
      />
      <p className="mt-2 text-sm">Searching...</p>
    </div>
  );
}

/**
 * No results found state
 */
function NoResultsState({ query }: { query: string }) {
  return (
    <div className="p-6 text-center text-gray-400">
      <MagnifyingGlassIcon className="mx-auto mb-2 h-10 w-10 opacity-50" />
      <p>No results found for "{query}"</p>
      <p className="mt-1 text-sm">Try different keywords or filters</p>
    </div>
  );
}

/**
 * Recent searches suggestions state
 */
function SuggestionsState({
  suggestions,
  onSuggestionClick,
}: {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div>
      <div className="px-3 py-2 text-xs uppercase tracking-wider text-gray-500">
        Recent Searches
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-dark-700"
        >
          <ClockIcon className="h-4 w-4 text-gray-500" />
          <span>{suggestion}</span>
        </button>
      ))}
    </div>
  );
}
