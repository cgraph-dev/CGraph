/**
 * Badge Filters Component
 */

import { Search } from 'lucide-react';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORIES,
  RARITIES,
  RARITY_COLORS,
  RARITY_BG_COLORS,
} from './constants';
import type { BadgeFiltersProps } from './types';

/**
 * unknown for the settings module.
 */
/**
 * Badge Filters component.
 */
export function BadgeFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedRarity,
  onRarityChange,
}: BadgeFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        <input
          type="text"
          placeholder="Search badges..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={`rounded-lg px-4 py-2 font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-purple-500 text-white'
              : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.06]'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category];
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.06]'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>

      {/* Rarity Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onRarityChange('all')}
          className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
            selectedRarity === 'all'
              ? 'bg-purple-500 text-white'
              : 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.06]'
          }`}
        >
          All Rarities
        </button>
        {RARITIES.map((rarity) => (
          <button
            key={rarity}
            onClick={() => onRarityChange(rarity)}
            className={`rounded-lg px-3 py-1 text-sm font-medium capitalize transition-colors ${
              selectedRarity === rarity
                ? `${RARITY_BG_COLORS[rarity]} text-white`
                : `${RARITY_COLORS[rarity]} bg-white/[0.04] hover:bg-white/[0.06]`
            }`}
          >
            {rarity}
          </button>
        ))}
      </div>
    </div>
  );
}
