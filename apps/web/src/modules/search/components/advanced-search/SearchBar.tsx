/**
 * SearchBar Component - Search input with filter toggle button
 * @module modules/search/components/advanced-search
 */
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components';
import type { AdvancedSearchFilters } from './types';

interface SearchBarProps {
  filters: AdvancedSearchFilters;
  updateFilter: <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => void;
  handleSearch: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isLoading: boolean;
}

export function SearchBar({
  filters,
  updateFilter,
  handleSearch,
  handleKeyPress,
  isExpanded,
  setIsExpanded,
  isLoading,
}: SearchBarProps) {
  return (
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
  );
}
