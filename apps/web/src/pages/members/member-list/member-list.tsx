/**
 * MemberList page - main component for member directory
 */

import { UserGroupIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useMemberList } from './useMemberList';
import { MemberFiltersPanel } from './member-filters-panel';
import { MemberTableHeader } from './member-table-header';
import { MemberRow } from './member-row';
import { MemberTableSkeleton } from './member-table-skeleton';
import { MemberTableEmpty } from './member-table-empty';
import { Pagination } from './pagination';
import { MemberStatsCards } from './member-stats-cards';

/**
 * Member List Page
 *
 * MyBB-style member list with:
 * - Search by username, email
 * - Filter by group, online status, join date
 * - Sort by various criteria
 * - Pagination
 */
export default function MemberList() {
  const {
    members,
    userGroups,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    totalMembers,
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    filterGroup,
    setFilterGroup,
    filterOnlineOnly,
    setFilterOnlineOnly,
    filterJoinedAfter,
    setFilterJoinedAfter,
    filterJoinedBefore,
    setFilterJoinedBefore,
    hasActiveFilters,
    clearFilters,
    sortField,
    sortOrder,
    handleSort,
    fetchMembers,
  } = useMemberList();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Member List</h1>
            <p className="text-muted-foreground text-sm">
              {(totalMembers ?? 0).toLocaleString()} registered members
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMembers()}
          className="bg-secondary hover:bg-secondary/80 mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors sm:mt-0"
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <MemberFiltersPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        hasActiveFilters={hasActiveFilters}
        filterGroup={filterGroup}
        onFilterGroupChange={setFilterGroup}
        filterOnlineOnly={filterOnlineOnly}
        onFilterOnlineChange={setFilterOnlineOnly}
        filterJoinedAfter={filterJoinedAfter}
        onFilterJoinedAfterChange={setFilterJoinedAfter}
        filterJoinedBefore={filterJoinedBefore}
        onFilterJoinedBeforeChange={setFilterJoinedBefore}
        onClearFilters={clearFilters}
        userGroups={userGroups}
        onPageReset={() => setPage(1)}
      />

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 mb-6 rounded-lg border p-4">
          {error}
        </div>
      )}

      {/* Members table */}
      <div className="bg-card border-border overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <MemberTableHeader sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
            <tbody>
              {isLoading ? (
                <MemberTableSkeleton />
              ) : members.length === 0 ? (
                <MemberTableEmpty />
              ) : (
                members.map((member) => <MemberRow key={member.id} member={member} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Stats cards */}
      <MemberStatsCards totalMembers={totalMembers} members={members} />
    </div>
  );
}
