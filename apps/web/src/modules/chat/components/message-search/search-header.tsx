/**
 * SearchHeader Component
 *
 * Search input with clear and close buttons
 */

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SearchHeaderProps } from './types';

/**
 * Search header with input field
 */
export function SearchHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onClose,
  inputRef,
}: SearchHeaderProps) {
  return (
    <div className="border-b border-white/10 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Search Messages</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
          <XMarkIcon className="h-5 w-5 text-white/60" />
        </button>
      </div>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search in messages..."
          className="focus:ring-accent-500/50 w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2"
        />
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition-colors hover:bg-white/10"
          >
            <XMarkIcon className="h-4 w-4 text-white/40" />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchHeader;
