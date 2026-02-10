/**
 * MemberSearchBar - Search and filter controls for the members list
 * @module modules/groups/components/group-settings/members-tab
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MemberSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
}

export function MemberSearchBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: MemberSearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-dark-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
        />
      </div>
      <select
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
        className="rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
      >
        <option value="all">All Roles</option>
        <option value="owner">Owners</option>
        <option value="admin">Admins</option>
        <option value="moderator">Moderators</option>
        <option value="member">Members</option>
      </select>
    </div>
  );
}
