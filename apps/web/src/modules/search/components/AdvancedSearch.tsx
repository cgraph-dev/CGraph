import { useState, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { useForumStore } from '@/stores/forumStore';
import { Button } from '@/components';
import { cn } from '@/lib/utils';

/**
 * Advanced search filters - MyBB-style
 */
export interface AdvancedSearchFilters {
  // Query terms
  keywords: string;
  author: string;

  // Date range
  dateRange: 'any' | 'day' | 'week' | 'month' | 'year' | 'custom';
  dateFrom?: string;
  dateTo?: string;

  // Search scope
  searchIn: 'all' | 'titles' | 'content' | 'firstPost';

  // Forum filter
  forumId: string | null;
  includeSubforums: boolean;

  // Content type
  contentType: 'all' | 'threads' | 'posts';

  // Thread status
  showClosed: boolean;
  showSticky: boolean;
  showNormal: boolean;

  // Results
  sortBy: 'relevance' | 'date' | 'author' | 'replies' | 'views';
  sortOrder: 'desc' | 'asc';
  resultsPerPage: 10 | 25 | 50;

  // Post count
  minReplies?: number;
  maxReplies?: number;

  // Has attachments/poll
  hasAttachments?: boolean;
  hasPoll?: boolean;
}

const defaultFilters: AdvancedSearchFilters = {
  keywords: '',
  author: '',
  dateRange: 'any',
  searchIn: 'all',
  forumId: null,
  includeSubforums: true,
  contentType: 'all',
  showClosed: true,
  showSticky: true,
  showNormal: true,
  sortBy: 'relevance',
  sortOrder: 'desc',
  resultsPerPage: 25,
};

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters) => void;
  isLoading?: boolean;
  className?: string;
  /** Start expanded */
  defaultExpanded?: boolean;
}

export default function AdvancedSearch({
  onSearch,
  isLoading = false,
  className = '',
  defaultExpanded = false,
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>(defaultFilters);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { forums } = useForumStore();

  const updateFilter = useCallback(
    <K extends keyof AdvancedSearchFilters>(key: K, value: AdvancedSearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSearch = useCallback(() => {
    if (!filters.keywords.trim() && !filters.author.trim()) {
      return;
    }
    onSearch(filters);
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className={cn('overflow-hidden rounded-xl border border-dark-500 bg-dark-800', className)}>
      {/* Main search bar */}
      <div className="border-b border-dark-500 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.keywords}
              onChange={(e) => updateFilter('keywords', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search keywords..."
              className="w-full rounded-lg border border-dark-500 bg-dark-700 py-3 pl-11 pr-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={isLoading || (!filters.keywords.trim() && !filters.author.trim())}
            className="px-6"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-gray-400 transition-colors hover:bg-dark-600 hover:text-gray-200"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {isExpanded && (
        <div className="space-y-6 p-4">
          {/* Row 1: Author & Forum */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Author filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">
                <UserIcon className="mr-2 inline h-4 w-4" />
                Author
              </label>
              <input
                type="text"
                value={filters.author}
                onChange={(e) => updateFilter('author', e.target.value)}
                placeholder="Username..."
                className="w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Forum filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">
                <FolderIcon className="mr-2 inline h-4 w-4" />
                Forum
              </label>
              <select
                value={filters.forumId || ''}
                onChange={(e) => updateFilter('forumId', e.target.value || null)}
                className="w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Forums</option>
                {forums.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.name}
                  </option>
                ))}
              </select>
              {filters.forumId && (
                <label className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={filters.includeSubforums}
                    onChange={(e) => updateFilter('includeSubforums', e.target.checked)}
                    className="rounded border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
                  />
                  Include subforums
                </label>
              )}
            </div>
          </div>

          {/* Row 2: Date range & Search in */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Date range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">
                <CalendarIcon className="mr-2 inline h-4 w-4" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  updateFilter('dateRange', e.target.value as AdvancedSearchFilters['dateRange'])
                }
                className="w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="any">Any time</option>
                <option value="day">Past 24 hours</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
                <option value="year">Past year</option>
                <option value="custom">Custom range</option>
              </select>

              {filters.dateRange === 'custom' && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="flex-1 rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="self-center text-gray-500">to</span>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="flex-1 rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            {/* Search in */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">
                <ChatBubbleLeftRightIcon className="mr-2 inline h-4 w-4" />
                Search In
              </label>
              <select
                value={filters.searchIn}
                onChange={(e) =>
                  updateFilter('searchIn', e.target.value as AdvancedSearchFilters['searchIn'])
                }
                className="w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Titles and content</option>
                <option value="titles">Titles only</option>
                <option value="content">Content only</option>
                <option value="firstPost">First post only</option>
              </select>
            </div>
          </div>

          {/* Row 3: Content type & Sort */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Content type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">Content Type</label>
              <div className="flex gap-4">
                {(['all', 'threads', 'posts'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 text-gray-300">
                    <input
                      type="radio"
                      name="contentType"
                      value={type}
                      checked={filters.contentType === type}
                      onChange={() => updateFilter('contentType', type)}
                      className="border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
                    />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            {/* Sort by */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">
                <ArrowsUpDownIcon className="mr-2 inline h-4 w-4" />
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    updateFilter('sortBy', e.target.value as AdvancedSearchFilters['sortBy'])
                  }
                  className="flex-1 rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="author">Author</option>
                  <option value="replies">Replies</option>
                  <option value="views">Views</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => updateFilter('sortOrder', e.target.value as 'desc' | 'asc')}
                  className="w-32 rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 4: Thread status checkboxes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-400">Thread Status</label>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.showNormal}
                  onChange={(e) => updateFilter('showNormal', e.target.checked)}
                  className="rounded border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
                />
                Normal threads
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.showSticky}
                  onChange={(e) => updateFilter('showSticky', e.target.checked)}
                  className="rounded border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
                />
                Sticky/pinned
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.showClosed}
                  onChange={(e) => updateFilter('showClosed', e.target.checked)}
                  className="rounded border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
                />
                Closed threads
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments || false}
                  onChange={(e) => updateFilter('hasAttachments', e.target.checked || undefined)}
                  className="rounded border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
                />
                Has attachments
              </label>
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.hasPoll || false}
                  onChange={(e) => updateFilter('hasPoll', e.target.checked || undefined)}
                  className="rounded border-dark-400 bg-dark-600 text-primary-500 focus:ring-primary-500"
                />
                Has poll
              </label>
            </div>
          </div>

          {/* Row 5: Reply count range */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-400">Reply Count</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                value={filters.minReplies ?? ''}
                onChange={(e) =>
                  updateFilter('minReplies', e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="Min"
                className="w-24 rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min="0"
                value={filters.maxReplies ?? ''}
                onChange={(e) =>
                  updateFilter('maxReplies', e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="Max"
                className="w-24 rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-400">replies</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-dark-500 pt-4">
            <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-200">
              Reset filters
            </button>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                Results per page:
                <select
                  value={filters.resultsPerPage}
                  onChange={(e) =>
                    updateFilter('resultsPerPage', parseInt(e.target.value) as 10 | 25 | 50)
                  }
                  className="rounded border border-dark-500 bg-dark-700 px-2 py-1 text-gray-200"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>

              <Button onClick={handleSearch} disabled={isLoading}>
                Search
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AdvancedSearch };
