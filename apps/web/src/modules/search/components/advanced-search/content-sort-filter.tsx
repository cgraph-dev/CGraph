/**
 * ContentSortFilter – content-type radios & sort-by / sort-order selects
 * @module modules/search/components/advanced-search
 */
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import {
  SELECT_CLS,
  LABEL_CLS,
  CONTENT_TYPES,
  SORT_BY_OPTIONS,
} from '@/modules/search/components/advanced-search/constants';
import type {
  AdvancedSearchFilters,
  FilterUpdateFn,
} from '@/modules/search/components/advanced-search/types';

interface ContentSortFilterProps {
  filters: AdvancedSearchFilters;
  updateFilter: FilterUpdateFn;
}

export function ContentSortFilter({ filters, updateFilter }: ContentSortFilterProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Content type */}
      <div>
        <label className={LABEL_CLS}>Content Type</label>
        <div className="flex gap-4">
          {CONTENT_TYPES.map((type) => (
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
        <label className={LABEL_CLS}>
          <ArrowsUpDownIcon className="mr-2 inline h-4 w-4" />
          Sort By
        </label>
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) =>
              // type assertion: select element value matches sortBy filter union
              updateFilter('sortBy', e.target.value as AdvancedSearchFilters['sortBy'])
            }
            className={`flex-1 ${SELECT_CLS}`}
          >
            {SORT_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
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
  );
}
