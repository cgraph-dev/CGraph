/**
 * ThreadStatusFilters – checkbox group for thread status & attachment filters
 * @module modules/search/components/advanced-search
 */
import {
  CHECKBOX_CLS,
  THREAD_STATUS_OPTIONS,
} from '@/modules/search/components/advanced-search/constants';
import type { AdvancedSearchFilters } from '@/modules/search/components/advanced-search/types';

interface ThreadStatusFiltersProps {
  filters: AdvancedSearchFilters;
  updateFilter: <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => void;
}

/**
 * Thread Status Filters component.
 */
export function ThreadStatusFilters({ filters, updateFilter }: ThreadStatusFiltersProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-400">Thread Status</label>
      <div className="flex flex-wrap gap-6">
        {THREAD_STATUS_OPTIONS.map(({ key, label, boolean: plain }) => (
          <label key={key} className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
               
              checked={plain ? (filters[key] as boolean) : (filters[key] as boolean) || false} // type assertion: filter values are boolean for checkbox inputs
              onChange={(e) => {
                const val = plain ? e.target.checked : e.target.checked || undefined;
                 
                updateFilter(key, val as AdvancedSearchFilters[typeof key]); // type assertion: dynamic filter key value type
              }}
              className={CHECKBOX_CLS}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
