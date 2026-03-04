/**
 * AdvancedSearch Component - Collapsible search form with filters
 * @module modules/search/components/advanced-search
 */
import { useState, useCallback } from 'react';
import { useForumStore } from '@/modules/forums/store';
import { cn } from '@/lib/utils';
import type { AdvancedSearchFilters, AdvancedSearchProps } from './types';
import { defaultFilters } from './constants';
import { SearchBar } from './search-bar';
import { FilterPanel } from './filter-panel';

/**
 * Advanced Search component.
 */
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
    <div className={cn('overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.04]', className)}>
      <SearchBar
        filters={filters}
        updateFilter={updateFilter}
        handleSearch={handleSearch}
        handleKeyPress={handleKeyPress}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isLoading={isLoading}
      />

      {isExpanded && (
        <FilterPanel
          filters={filters}
          updateFilter={updateFilter}
          handleSearch={handleSearch}
          handleReset={handleReset}
          isLoading={isLoading}
          forums={forums}
        />
      )}
    </div>
  );
}

export { AdvancedSearch };
