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
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useDebounce } from '@/shared/hooks';
import { createLogger } from '@/lib/logger';

import { DEFAULT_FILTERS } from './constants';
import { FiltersPanel } from './filters-panel';
import { SearchResults } from './search-results';
import { useSearchHistory } from './useSearchHistory';
import type { ForumSearchProps, SearchFilters, SearchResult } from './types';

const logger = createLogger('ForumSearch');

/**
 * unknown for the forums module.
 */
/**
 * Forum Search component.
 */
export function ForumSearch({
  forumId: _forumId,
  categories = [],
  onSearch,
  onResultClick,
  placeholder = 'Search posts, comments, users...',
  showFilters = true,
  className = '',
  variant: _variant = 'inline',
}: ForumSearchProps) {
  void _forumId;
  void _variant;

  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { addToHistory, getSuggestions } = useSearchHistory();
  const debouncedQuery = useDebounce(query, 300);

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setSuggestions(getSuggestions(debouncedQuery));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filters, getSuggestions]);

  const performSearch = async (searchQuery: string) => {
    if (!onSearch) return;

    setIsLoading(true);
    try {
      const searchResults = await onSearch(searchQuery, filters);
      setResults(searchResults);
      setSelectedIndex(-1);
    } catch (error) {
      logger.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      HapticFeedback.light();
      addToHistory(query.trim());
      performSearch(query.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, addToHistory]);

  const handleResultClick = (result: SearchResult) => {
    HapticFeedback.success();
    addToHistory(query);
    setIsOpen(false);
    onResultClick?.(result);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const toggleCategory = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-3">
          <MagnifyingGlassIcon
            className="h-5 w-5 flex-shrink-0"
            style={{ color: isOpen ? primaryColor : '#9ca3af' }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white placeholder-white/30 outline-none"
          />
          {query && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={clearSearch}
              className="rounded p-1 hover:bg-white/[0.10]"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </motion.button>
          )}
          {showFilters && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`rounded-lg p-2 transition-colors ${
                isFiltersOpen || hasActiveFilters ? '' : 'hover:bg-white/[0.10]'
              }`}
              style={
                isFiltersOpen || hasActiveFilters
                  ? { backgroundColor: `${primaryColor}20`, color: primaryColor }
                  : {}
              }
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </motion.button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <FiltersPanel
            isOpen={isFiltersOpen}
            filters={filters}
            categories={categories}
            primaryColor={primaryColor}
            onFilterChange={handleFilterChange}
            onToggleCategory={toggleCategory}
            onClearFilters={clearFilters}
          />
        )}
      </GlassCard>

      {/* Results Dropdown */}
      <SearchResults
        isOpen={isOpen}
        isLoading={isLoading}
        query={query}
        results={results}
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        primaryColor={primaryColor}
        onResultClick={handleResultClick}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
}

export default ForumSearch;
