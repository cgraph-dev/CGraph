/**
 * FilterBar component - search, category filter, and sort controls
 */

import { motion, AnimatePresence } from 'framer-motion';
import { FunnelIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { CATEGORY_ICONS, CATEGORIES } from './constants';
import type { AchievementCategory, SortOption } from './types';

interface FilterBarProps {
  searchQuery: string;
  selectedCategory: AchievementCategory | 'all';
  sortBy: SortOption;
  showFilters: boolean;
  primaryColor: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: AchievementCategory | 'all') => void;
  onSortChange: (sort: SortOption) => void;
  onToggleFilters: () => void;
}

/**
 * unknown for the gamification module.
 */
/**
 * Filter Bar component.
 */
export function FilterBar({
  searchQuery,
  selectedCategory,
  sortBy,
  showFilters,
  primaryColor,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onToggleFilters,
}: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search achievements..."
          className="w-full rounded-lg bg-dark-700 py-2 pl-10 pr-4 outline-none focus:ring-2"
          // type assertion: CSS custom property requires CSSProperties widening
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
        />
      </div>

      {/* Category Filter */}
      <div className="relative">
        <button
          onClick={onToggleFilters}
          className="flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 hover:bg-dark-600"
        >
          <FunnelIcon className="h-5 w-5" />
          <span className="capitalize">{selectedCategory}</span>
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-dark-600 bg-dark-700 py-1 shadow-xl"
            >
              <button
                onClick={() => {
                  onCategoryChange('all');
                  onToggleFilters();
                }}
                className={`w-full px-4 py-2 text-left hover:bg-dark-600 ${
                  selectedCategory === 'all' ? 'text-white' : 'text-gray-400'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onCategoryChange(cat);
                    onToggleFilters();
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left capitalize hover:bg-dark-600 ${
                    selectedCategory === cat ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)} // type assertion: select value is constrained to SortOption
        className="rounded-lg bg-dark-700 px-4 py-2 outline-none"
      >
        <option value="rarity">By Rarity</option>
        <option value="recent">Recently Unlocked</option>
        <option value="progress">By Progress</option>
      </select>
    </div>
  );
}
