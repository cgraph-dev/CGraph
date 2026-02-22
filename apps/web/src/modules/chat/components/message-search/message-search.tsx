/**
 * MessageSearch Component
 *
 * Main search modal orchestrating state and sub-components
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MessageSearchProps, MessageSearchResult, SearchFilters } from './types';
import {
  highlightContent,
  generateMockResults,
  loadRecentSearches,
  saveRecentSearch,
  SEARCH_DEBOUNCE_MS,
} from './utils';
import { SearchHeader } from './search-header';
import { SearchFiltersPanel } from './search-filters-panel';
import { SearchResults } from './search-results';

/**
 * Message search modal component
 */
export function MessageSearch({
  isOpen,
  onClose,
  onResultClick,
  conversationId,
}: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Avoid unused var warning
  void conversationId;
  void filters;

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform search (mock implementation)
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Use mock results
      setResults(generateMockResults(query, highlightContent));
      setRecentSearches(saveRecentSearch(query, recentSearches));
      setIsLoading(false);
    },
    [recentSearches]
  );

  // Handle search input change with debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, SEARCH_DEBOUNCE_MS);
    },
    [performSearch]
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setResults([]);
    inputRef.current?.focus();
  }, []);

  // Jump to message
  const handleJumpToMessage = useCallback(
    (targetConversationId: string, messageId: string) => {
      if (onResultClick) {
        onResultClick(targetConversationId, messageId);
      }
      onClose();
    },
    [onClose, onResultClick]
  );

  // Handle recent search click
  const handleRecentSearchClick = useCallback(
    (term: string) => {
      setSearchQuery(term);
      performSearch(term);
    },
    [performSearch]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl"
        >
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onClose={onClose}
            inputRef={inputRef}
          />

          <SearchFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />

          <SearchResults
            isLoading={isLoading}
            searchQuery={searchQuery}
            results={results}
            recentSearches={recentSearches}
            onJumpToMessage={handleJumpToMessage}
            onRecentSearchClick={handleRecentSearchClick}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MessageSearch;
