/**
 * FilterControls - search, rarity, status, and sort controls
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { RARITY_ORDER } from './constants';
import type { FilterState, SortOption, AchievementRarity } from './types';

interface FilterControlsProps {
  filters: FilterState;
  showSearch: boolean;
  showFilters: boolean;
  onFilterUpdate: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
}

export function FilterControls({
  filters,
  showSearch,
  showFilters,
  onFilterUpdate,
}: FilterControlsProps) {
  if (!showSearch && !showFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      {showSearch && (
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={filters.search}
            onChange={(e) => onFilterUpdate('search', e.target.value)}
            className={cn(
              'w-full rounded-lg py-2 pl-9 pr-4',
              'border border-white/10 bg-dark-700/50',
              'text-white placeholder-gray-500',
              'focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50',
              'transition-all'
            )}
          />
        </div>
      )}

      {/* Rarity filter */}
      {showFilters && (
        <select
          value={filters.rarity}
          onChange={(e) => onFilterUpdate('rarity', e.target.value as AchievementRarity | 'all')}
          className={cn(
            'rounded-lg px-3 py-2',
            'border border-white/10 bg-dark-700/50',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            'cursor-pointer'
          )}
        >
          <option value="all">All Rarities</option>
          {RARITY_ORDER.map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </option>
          ))}
        </select>
      )}

      {/* Status filter */}
      {showFilters && (
        <select
          value={filters.status}
          onChange={(e) => onFilterUpdate('status', e.target.value as FilterState['status'])}
          className={cn(
            'rounded-lg px-3 py-2',
            'border border-white/10 bg-dark-700/50',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            'cursor-pointer'
          )}
        >
          <option value="all">All Status</option>
          <option value="unlocked">Unlocked</option>
          <option value="in-progress">In Progress</option>
          <option value="locked">Locked</option>
        </select>
      )}

      {/* Sort */}
      {showFilters && (
        <select
          value={filters.sort}
          onChange={(e) => onFilterUpdate('sort', e.target.value as SortOption)}
          className={cn(
            'rounded-lg px-3 py-2',
            'border border-white/10 bg-dark-700/50',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            'cursor-pointer'
          )}
        >
          <option value="rarity">Sort by Rarity</option>
          <option value="name">Sort by Name</option>
          <option value="progress">Sort by Progress</option>
          <option value="unlocked">Sort by Status</option>
        </select>
      )}
    </div>
  );
}
