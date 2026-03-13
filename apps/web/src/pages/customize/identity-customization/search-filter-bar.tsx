/**
 * SearchFilterBar – search input + rarity dropdown for IdentityCustomization.
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { Rarity } from './types';
import { RARITIES } from './constants';
import type { SectionId } from './useIdentityCustomization';

interface SearchFilterBarProps {
  activeSection: SectionId;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedRarity: Rarity | 'all';
  onRarityChange: (value: Rarity | 'all') => void;
}

/**
 * unknown for the customize module.
 */
/**
 * Search Filter Bar component.
 */
export function SearchFilterBar({
  activeSection,
  searchQuery,
  onSearchChange,
  selectedRarity,
  onRarityChange,
}: SearchFilterBarProps) {
  if (activeSection === 'layouts') return null;

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${activeSection}...`}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {(activeSection === 'borders' || activeSection === 'badges') && (
        <select
          value={selectedRarity}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          onChange={(e) => onRarityChange(e.target.value as Rarity | 'all')} // safe downcast – select event value
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="all">All Rarities</option>
          {RARITIES.map((rarity) => (
            <option key={rarity.value} value={rarity.value}>
              {rarity.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
