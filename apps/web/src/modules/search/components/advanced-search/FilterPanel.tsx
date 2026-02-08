/**
 * FilterPanel Component - Advanced search filter options panel
 * @module modules/search/components/advanced-search
 */
import { AuthorForumFilter } from '@/modules/search/components/advanced-search/AuthorForumFilter';
import { ContentSortFilter } from '@/modules/search/components/advanced-search/ContentSortFilter';
import { DateSearchFilter } from '@/modules/search/components/advanced-search/DateSearchFilter';
import { FilterActions } from '@/modules/search/components/advanced-search/FilterActions';
import { ReplyCountFilter } from '@/modules/search/components/advanced-search/ReplyCountFilter';
import { ThreadStatusFilters } from '@/modules/search/components/advanced-search/ThreadStatusFilters';
import type { AdvancedSearchFilters, FilterUpdateFn, Forum } from './types';

interface FilterPanelProps {
  filters: AdvancedSearchFilters;
  updateFilter: FilterUpdateFn;
  handleSearch: () => void;
  handleReset: () => void;
  isLoading: boolean;
  forums: Forum[];
}

export function FilterPanel({
  filters,
  updateFilter,
  handleSearch,
  handleReset,
  isLoading,
  forums,
}: FilterPanelProps) {
  return (
    <div className="space-y-6 p-4">
      <AuthorForumFilter filters={filters} updateFilter={updateFilter} forums={forums} />
      <DateSearchFilter filters={filters} updateFilter={updateFilter} />
      <ContentSortFilter filters={filters} updateFilter={updateFilter} />
      <ThreadStatusFilters filters={filters} updateFilter={updateFilter} />
      <ReplyCountFilter filters={filters} updateFilter={updateFilter} />
      <FilterActions
        filters={filters}
        updateFilter={updateFilter}
        handleSearch={handleSearch}
        handleReset={handleReset}
        isLoading={isLoading}
      />
    </div>
  );
}
