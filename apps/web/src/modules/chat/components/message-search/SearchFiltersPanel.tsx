/**
 * SearchFiltersPanel Component
 *
 * Filter controls for message search
 */

import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import type { SearchFiltersPanelProps, SearchFilters } from './types';

/**
 * Collapsible filters panel
 */
export function SearchFiltersPanel({
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
}: SearchFiltersPanelProps) {
  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="border-b border-white/10 px-4 py-2">
      <button
        onClick={onToggleFilters}
        className="flex items-center space-x-2 text-sm text-white/60 transition-colors hover:text-white/80"
      >
        <AdjustmentsHorizontalIcon className="h-4 w-4" />
        <span>Filters</span>
        {showFilters ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>

      {showFilters && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">From Date</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
              className="focus:ring-accent-500/50 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/80 focus:outline-none focus:ring-1"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">To Date</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
              className="focus:ring-accent-500/50 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/80 focus:outline-none focus:ring-1"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-white/50">Message Type</label>
            <select
              value={filters.messageType || ''}
              onChange={(e) => updateFilter('messageType', e.target.value || undefined)}
              className="focus:ring-accent-500/50 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/80 focus:outline-none focus:ring-1"
            >
              <option value="">All Types</option>
              <option value="text">Text</option>
              <option value="image">Images</option>
              <option value="file">Files</option>
              <option value="link">Links</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchFiltersPanel;
