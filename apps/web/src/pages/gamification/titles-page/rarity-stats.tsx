/**
 * RarityStats Component
 *
 * Grid of rarity filter buttons with progress stats
 */

import type { RarityStatsProps } from './types';
import { RARITY_ORDER, RARITY_STYLES } from './constants';

export function RarityStats({ stats, selectedRarity, onRaritySelect }: RarityStatsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
      {/* All button */}
      <button
        onClick={() => onRaritySelect('all')}
        className={`rounded-xl p-3 transition-all ${
          selectedRarity === 'all'
            ? 'bg-accent-primary text-white'
            : 'bg-surface-secondary hover:bg-surface-tertiary text-text-secondary'
        }`}
      >
        <div className="text-xs font-medium">All</div>
        <div className="text-lg font-bold">
          {stats.owned}/{stats.total}
        </div>
      </button>

      {/* Rarity buttons */}
      {RARITY_ORDER.map((rarity) => {
        const style = RARITY_STYLES[rarity];
        const rarityStats = stats.byRarity[rarity];
        const isSelected = selectedRarity === rarity;

        return (
          <button
            key={rarity}
            onClick={() => onRaritySelect(rarity)}
            className={`rounded-xl p-3 transition-all ${
              isSelected
                ? `bg-gradient-to-r ${style.gradient} text-white`
                : 'bg-surface-secondary hover:bg-surface-tertiary'
            }`}
          >
            <div className={`text-xs font-medium capitalize ${!isSelected ? style.text : ''}`}>
              {rarity}
            </div>
            <div className="text-lg font-bold">
              {rarityStats.owned}/{rarityStats.total}
            </div>
          </button>
        );
      })}
    </div>
  );
}
