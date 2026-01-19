import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
import { useForumStore, type Post, type ForumCategory } from '@/stores/forumStore';
import { formatTimeAgo } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

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

interface SearchResult {
  id: string;
  type: 'post' | 'comment' | 'user' | 'forum';
  title: string;
  snippet: string;
  author: {
    username: string;
    avatarUrl: string | null;
  };
  forumName?: string;
  forumSlug?: string;
  score?: number;
  commentCount?: number;
  createdAt: string;
  matchedTerms?: string[];
}

interface ForumSearchProps {
  forumId?: string;
  categories?: ForumCategory[];
  onSearch?: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
  variant?: 'inline' | 'modal' | 'expanded';
}

export interface SearchFilters {
  categories: string[];
  sortBy: 'relevance' | 'date' | 'score' | 'comments';
  timeRange: 'all' | 'day' | 'week' | 'month' | 'year';
  type: 'all' | 'posts' | 'comments' | 'users';
  author?: string;
  hasMedia?: boolean;
  isPinned?: boolean;
}

const DEFAULT_FILTERS: SearchFilters = {
  categories: [],
  sortBy: 'relevance',
  timeRange: 'all',
  type: 'all',
};

export function ForumSearch({
  forumId,
  categories = [],
  onSearch,
  onResultClick,
  placeholder = 'Search posts, comments, users...',
  showFilters = true,
  className = '',
  variant = 'inline',
}: ForumSearchProps) {
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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const debouncedQuery = useDebounce(query, 300);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('forumSearchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      generateSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, filters]);

  const performSearch = async (searchQuery: string) => {
    if (!onSearch) return;
    
    setIsLoading(true);
    try {
      const searchResults = await onSearch(searchQuery, filters);
      setResults(searchResults);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = (partial: string) => {
    // Combine history with common terms
    const historySuggestions = searchHistory.filter((h) =>
      h.toLowerCase().includes(partial.toLowerCase())
    );
    setSuggestions(historySuggestions.slice(0, 5));
  };

  const addToHistory = (searchQuery: string) => {
    const newHistory = [searchQuery, ...searchHistory.filter((h) => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('forumSearchHistory', JSON.stringify(newHistory));
  };

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      HapticFeedback.light();
      addToHistory(query.trim());
      performSearch(query.trim());
    }
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    HapticFeedback.success();
    addToHistory(query);
    setIsOpen(false);
    onResultClick?.(result);
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

  const renderSearchResult = (result: SearchResult, index: number) => (
    <motion.div
      key={result.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`p-3 cursor-pointer transition-colors ${
        index === selectedIndex
          ? 'bg-dark-600'
          : 'hover:bg-dark-700'
      }`}
      onClick={() => handleResultClick(result)}
    >
      <div className="flex items-start gap-3">
        {result.type === 'user' ? (
          <img
            src={result.author.avatarUrl || '/default-avatar.png'}
            alt={result.author.username}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            {result.type === 'post' ? (
              <ChatBubbleLeftIcon className="h-5 w-5" style={{ color: primaryColor }} />
            ) : result.type === 'comment' ? (
              <HashtagIcon className="h-5 w-5" style={{ color: primaryColor }} />
            ) : (
              <TagIcon className="h-5 w-5" style={{ color: primaryColor }} />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-gray-500">
              {result.type}
            </span>
            {result.forumName && (
              <span className="text-xs text-gray-400">
                in {result.forumName}
              </span>
            )}
          </div>
          <p className="font-medium truncate">{result.title}</p>
          <p className="text-sm text-gray-400 line-clamp-2">{result.snippet}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>by {result.author.username}</span>
            <span>{formatTimeAgo(result.createdAt)}</span>
            {result.score !== undefined && (
              <span className="flex items-center gap-0.5">
                <FireIcon className="h-3 w-3" />
                {result.score}
              </span>
            )}
            {result.commentCount !== undefined && (
              <span className="flex items-center gap-0.5">
                <ChatBubbleLeftIcon className="h-3 w-3" />
                {result.commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderFiltersPanel = () => (
    <AnimatePresence>
      {isFiltersOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 border-t border-dark-600 space-y-4">
            {/* Sort Options */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'relevance', label: 'Relevance', icon: MagnifyingGlassIcon },
                  { value: 'date', label: 'Date', icon: ClockIcon },
                  { value: 'score', label: 'Score', icon: FireIcon },
                  { value: 'comments', label: 'Comments', icon: ChatBubbleLeftIcon },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilters((prev) => ({ ...prev, sortBy: value as SearchFilters['sortBy'] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filters.sortBy === value
                        ? 'text-white'
                        : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                    }`}
                    style={filters.sortBy === value ? { backgroundColor: primaryColor } : {}}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Time Range</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'day', label: 'Past Day' },
                  { value: 'week', label: 'Past Week' },
                  { value: 'month', label: 'Past Month' },
                  { value: 'year', label: 'Past Year' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilters((prev) => ({ ...prev, timeRange: value as SearchFilters['timeRange'] }))}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filters.timeRange === value
                        ? 'text-white'
                        : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                    }`}
                    style={filters.timeRange === value ? { backgroundColor: primaryColor } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Content Type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All', icon: null },
                  { value: 'posts', label: 'Posts', icon: ChatBubbleLeftIcon },
                  { value: 'comments', label: 'Comments', icon: HashtagIcon },
                  { value: 'users', label: 'Users', icon: UserIcon },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilters((prev) => ({ ...prev, type: value as SearchFilters['type'] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filters.type === value
                        ? 'text-white'
                        : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                    }`}
                    style={filters.type === value ? { backgroundColor: primaryColor } : {}}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        filters.categories.includes(category.id)
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: filters.categories.includes(category.id)
                          ? category.color || primaryColor
                          : `${category.color || primaryColor}20`,
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Clear all filters
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
          />
          {query && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={clearSearch}
              className="p-1 hover:bg-dark-600 rounded"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </motion.button>
          )}
          {showFilters && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isFiltersOpen || filters !== DEFAULT_FILTERS
                  ? ''
                  : 'hover:bg-dark-600'
              }`}
              style={
                isFiltersOpen || JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)
                  ? { backgroundColor: `${primaryColor}20`, color: primaryColor }
                  : {}
              }
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </motion.button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && renderFiltersPanel()}
      </GlassCard>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.length >= 2 || suggestions.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-2 z-50"
          >
            <GlassCard variant="frosted" className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-6 w-6 border-2 border-t-transparent rounded-full mx-auto"
                    style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
                  />
                  <p className="mt-2 text-sm">Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y divide-dark-700">
                  {results.map((result, index) => renderSearchResult(result, index))}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-6 text-center text-gray-400">
                  <MagnifyingGlassIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                  <p className="text-sm mt-1">Try different keywords or filters</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div>
                  <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                    Recent Searches
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion);
                        performSearch(suggestion);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-dark-700"
                    >
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ForumSearch;
