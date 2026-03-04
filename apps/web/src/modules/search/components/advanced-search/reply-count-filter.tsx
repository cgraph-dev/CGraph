/**
 * ReplyCountFilter – min/max reply count range inputs
 * @module modules/search/components/advanced-search
 */
import type { AdvancedSearchFilters } from '@/modules/search/components/advanced-search/types';

const NUM_INPUT_CLS =
  'w-24 rounded-lg border border-white/[0.10] bg-white/[0.06] px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500';

interface ReplyCountFilterProps {
  filters: AdvancedSearchFilters;
  updateFilter: <K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => void;
}

/**
 * unknown for the search module.
 */
/**
 * Reply Count Filter component.
 */
export function ReplyCountFilter({ filters, updateFilter }: ReplyCountFilterProps) {
  return (
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
          className={NUM_INPUT_CLS}
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
          className={NUM_INPUT_CLS}
        />
        <span className="text-sm text-gray-400">replies</span>
      </div>
    </div>
  );
}
