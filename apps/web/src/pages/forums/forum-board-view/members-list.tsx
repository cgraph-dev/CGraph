import { UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

import { MemberCard } from './member-card';
import { SKELETON_COUNTS, MEMBER_SORT_OPTIONS } from './constants';
import type { MembersListProps, MemberSortOption } from './types';

/**
 * List of forum members with search and sort controls
 */
export function MembersList({
  members,
  isLoading,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: MembersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(SKELETON_COUNTS.members)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-dark-700" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-dark-600 bg-dark-700 py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as MemberSortOption)} // safe downcast – select event value
          className="rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {MEMBER_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Members Grid */}
      {members.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <UserIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
