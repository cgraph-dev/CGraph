/**
 * QueueFilters component
 * @module pages/forums/moderation-queue
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { FilterState, FilterKey } from './types';

interface QueueFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

// Type-safe filter update helper
const createFilterUpdater =
  <K extends FilterKey>(setFilters: React.Dispatch<React.SetStateAction<FilterState>>, key: K) =>
  (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value as FilterState[K] })); // safe downcast – select event value
  };

/**
 * unknown for the forums module.
 */
/**
 * Queue Filters component.
 */
export function QueueFilters({ filters, setFilters }: QueueFiltersProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search content or username..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full rounded-lg border border-dark-500 bg-dark-700 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={createFilterUpdater(setFilters, 'status')}
          className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="pending">Pending Only</option>
          <option value="all">All Status</option>
        </select>

        {/* Type Filter */}
        <select
          value={filters.itemType}
          onChange={createFilterUpdater(setFilters, 'itemType')}
          className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="all">All Types</option>
          <option value="thread">Threads</option>
          <option value="post">Posts</option>
          <option value="comment">Comments</option>
          <option value="user">Users</option>
          <option value="attachment">Attachments</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={createFilterUpdater(setFilters, 'priority')}
          className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        {/* Reason Filter */}
        <select
          value={filters.reason}
          onChange={createFilterUpdater(setFilters, 'reason')}
          className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        >
          <option value="all">All Reasons</option>
          <option value="new_user">New User</option>
          <option value="flagged">Auto-Flagged</option>
          <option value="auto_spam">Spam Detection</option>
          <option value="reported">User Report</option>
          <option value="manual">Manual Review</option>
        </select>
      </div>
    </GlassCard>
  );
}
