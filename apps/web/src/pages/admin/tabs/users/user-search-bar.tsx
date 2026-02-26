/**
 * Admin user search bar component.
 * @module
 */
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

/**
 * unknown for the admin module.
 */
/**
 * User Search Bar component.
 */
export function UserSearchBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: UserSearchBarProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by username or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
    </div>
  );
}
