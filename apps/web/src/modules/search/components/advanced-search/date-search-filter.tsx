/**
 * DateSearchFilter – date-range select (with custom inputs) & search-in select
 * @module modules/search/components/advanced-search
 */
import { CalendarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import {
  SELECT_CLS,
  LABEL_CLS,
  DATE_RANGE_OPTIONS,
  SEARCH_IN_OPTIONS,
} from '@/modules/search/components/advanced-search/constants';
import type {
  AdvancedSearchFilters,
  FilterUpdateFn,
} from '@/modules/search/components/advanced-search/types';

const DATE_INPUT_CLS =
  'flex-1 rounded-lg border border-white/[0.10] bg-white/[0.06] px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500';

interface DateSearchFilterProps {
  filters: AdvancedSearchFilters;
  updateFilter: FilterUpdateFn;
}

/**
 * unknown for the search module.
 */
/**
 * Date Search Filter component.
 */
export function DateSearchFilter({ filters, updateFilter }: DateSearchFilterProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Date range */}
      <div>
        <label className={LABEL_CLS}>
          <CalendarIcon className="mr-2 inline h-4 w-4" />
          Date Range
        </label>
        <select
          value={filters.dateRange}
          onChange={
            (e) =>
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              updateFilter('dateRange', e.target.value as AdvancedSearchFilters['dateRange']) // safe downcast – select event value
          }
          className={SELECT_CLS}
        >
          {DATE_RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {filters.dateRange === 'custom' && (
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className={DATE_INPUT_CLS}
            />
            <span className="self-center text-gray-500">to</span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className={DATE_INPUT_CLS}
            />
          </div>
        )}
      </div>

      {/* Search in */}
      <div>
        <label className={LABEL_CLS}>
          <ChatBubbleLeftRightIcon className="mr-2 inline h-4 w-4" />
          Search In
        </label>
        <select
          value={filters.searchIn}
          onChange={
            (e) =>
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              updateFilter('searchIn', e.target.value as AdvancedSearchFilters['searchIn']) // safe downcast – select event value
          }
          className={SELECT_CLS}
        >
          {SEARCH_IN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
