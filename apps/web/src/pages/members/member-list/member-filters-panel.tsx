/**
 * MemberFiltersPanel component - search and filter controls
 */

import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { UserGroup } from './types';

interface MemberFiltersPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  filterGroup: string;
  onFilterGroupChange: (group: string) => void;
  filterOnlineOnly: boolean;
  onFilterOnlineChange: (online: boolean) => void;
  filterJoinedAfter: string;
  onFilterJoinedAfterChange: (date: string) => void;
  filterJoinedBefore: string;
  onFilterJoinedBeforeChange: (date: string) => void;
  onClearFilters: () => void;
  userGroups: UserGroup[];
  onPageReset: () => void;
}

/**
 * unknown for the members module.
 */
/**
 * Member Filters Panel component.
 */
export function MemberFiltersPanel({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  filterGroup,
  onFilterGroupChange,
  filterOnlineOnly,
  onFilterOnlineChange,
  filterJoinedAfter,
  onFilterJoinedAfterChange,
  filterJoinedBefore,
  onFilterJoinedBeforeChange,
  onClearFilters,
  userGroups,
  onPageReset,
}: MemberFiltersPanelProps) {
  return (
    <div className="bg-card border-border mb-6 rounded-lg border p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="text-muted-foreground absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-background border-border w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
            showFilters || hasActiveFilters
              ? 'text-primary-foreground bg-primary'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <FunnelIcon className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs">Active</span>
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="border-border mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* User group filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">User Group</label>
            <select
              value={filterGroup}
              onChange={(e) => {
                onFilterGroupChange(e.target.value);
                onPageReset();
              }}
              className="bg-background border-border w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Groups</option>
              {userGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.memberCount})
                </option>
              ))}
            </select>
          </div>

          {/* Online only */}
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={filterOnlineOnly}
                onChange={(e) => {
                  onFilterOnlineChange(e.target.checked);
                  onPageReset();
                }}
                className="border-border h-4 w-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">Online Only</span>
            </label>
          </div>

          {/* Joined after */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Joined After</label>
            <input
              type="date"
              value={filterJoinedAfter}
              onChange={(e) => {
                onFilterJoinedAfterChange(e.target.value);
                onPageReset();
              }}
              className="bg-background border-border w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Joined before */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Joined Before</label>
            <input
              type="date"
              value={filterJoinedBefore}
              onChange={(e) => {
                onFilterJoinedBeforeChange(e.target.value);
                onPageReset();
              }}
              className="bg-background border-border w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                onClick={onClearFilters}
                className="text-muted-foreground flex items-center gap-2 text-sm transition-colors hover:text-foreground"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
