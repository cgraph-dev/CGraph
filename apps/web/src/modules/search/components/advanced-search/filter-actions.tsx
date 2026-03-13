/**
 * FilterActions – reset / results-per-page / search button row
 * @module modules/search/components/advanced-search
 */
import { Button } from '@/components';
import type { AdvancedSearchFilters } from '@/modules/search/components/advanced-search/types';

interface FilterActionsProps {
  filters: AdvancedSearchFilters;
  updateFilter: <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => void;
  handleSearch: () => void;
  handleReset: () => void;
  isLoading: boolean;
}

/**
 * Filter Actions component.
 */
export function FilterActions({
  filters,
  updateFilter,
  handleSearch,
  handleReset,
  isLoading,
}: FilterActionsProps) {
  return (
    <div className="flex items-center justify-between border-t border-white/[0.10] pt-4">
      <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-200">
        Reset filters
      </button>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          Results per page:
          <select
            value={filters.resultsPerPage}
            onChange={
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              (e) => updateFilter('resultsPerPage', parseInt(e.target.value) as 10 | 25 | 50) // type assertion: select options are constrained to 10, 25, or 50
            }
            className="rounded border border-white/[0.10] bg-white/[0.06] px-2 py-1 text-gray-200"
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
  );
}
