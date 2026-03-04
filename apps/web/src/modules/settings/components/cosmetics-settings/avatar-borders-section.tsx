/**
 * Avatar Borders Section
 *
 * Manages avatar border selection, filtering, and equipping.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAvatarBorderStore } from '@/modules/gamification/store';
import { AvatarBorderRenderer } from '@/modules/social/components/avatar/avatar-border-renderer';

import type { SectionProps } from './types';
import { RARITY_COLORS } from './constants';
import { GridIcon, ListIcon } from './icons';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Avatar Borders Section component.
 */
export function AvatarBordersSection({ filters, setFilters, viewMode, setViewMode }: SectionProps) {
  const {
    allBorders,
    unlockedBorders,
    preferences,
    getFilteredBorders,
    equipBorder,
    purchaseBorder,
  } = useAvatarBorderStore();

  const equippedBorderId = preferences.equippedBorderId;
  const [selectedBorder, setSelectedBorder] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const filteredBorders = useMemo(() => {
    let result = getFilteredBorders();

    // Apply additional filters from props
    if (filters.theme !== 'all') {
      result = result.filter((b) => b.theme === filters.theme);
    }
    if (filters.rarity !== 'all') {
      result = result.filter((b) => b.rarity === filters.rarity);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(search) || b.description?.toLowerCase().includes(search)
      );
    }

    if (!filters.showLocked) {
      result = result.filter((b) => unlockedBorders.some((u) => u.borderId === b.id));
    }

    return result;
  }, [getFilteredBorders, filters, unlockedBorders]);

  const handleEquip = useCallback(
    async (borderId: string) => {
      await equipBorder(borderId);
    },
    [equipBorder]
  );

  const handlePurchase = useCallback(
    async (borderId: string) => {
      setPurchasing(true);
      try {
        const success = await purchaseBorder(borderId);
        if (success) {
          // Show success notification
        }
      } finally {
        setPurchasing(false);
      }
    },
    [purchaseBorder]
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative min-w-[200px] max-w-md flex-1">
          <input
            type="text"
            placeholder="Search borders..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        {/* Theme Filter */}
        <select
          value={filters.theme}
          onChange={(e) =>
            // type assertion: select element value matches filter union type
             
            setFilters((f) => ({ ...f, theme: e.target.value as typeof filters.theme }))
          }
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Themes</option>
          <option value="8bit">8-Bit</option>
          <option value="cyberpunk">Cyberpunk</option>
          <option value="fantasy">Fantasy</option>
          <option value="cosmic">Cosmic</option>
          <option value="elemental">Elemental</option>
          <option value="premium">Premium</option>
        </select>

        {/* Rarity Filter */}
        <select
          value={filters.rarity}
          onChange={(e) =>
            // type assertion: select element value matches filter union type
             
            setFilters((f) => ({ ...f, rarity: e.target.value as typeof filters.rarity }))
          }
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
          <option value="mythic">Mythic</option>
        </select>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded p-2 ${viewMode === 'grid' ? 'bg-white/10' : ''}`}
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded p-2 ${viewMode === 'list' ? 'bg-white/10' : ''}`}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {/* Equipped Border Preview */}
      {equippedBorderId && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-sm font-medium text-gray-400">Currently Equipped</h3>
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24">
              <AvatarBorderRenderer
                border={allBorders.find((b) => b.id === equippedBorderId)}
                size={96}
                src="/default-avatar.png"
              />
            </div>
            <div>
              <p className="font-medium">
                {allBorders.find((b) => b.id === equippedBorderId)?.name}
              </p>
              <p className="text-sm text-gray-400">
                {allBorders.find((b) => b.id === equippedBorderId)?.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Border Grid */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            : 'space-y-3'
        }
      >
        {filteredBorders.map((border) => {
          const isOwned = unlockedBorders.some((u) => u.borderId === border.id);
          const isEquipped = equippedBorderId === border.id;

          return (
            <motion.div
              key={border.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group relative cursor-pointer ${
                viewMode === 'grid' ? 'aspect-square' : 'flex items-center gap-4 p-4'
              } rounded-xl border bg-white/5 transition-all ${
                isEquipped
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                  : selectedBorder === border.id
                    ? 'border-white/20'
                    : 'border-white/5 hover:border-white/10'
              }`}
              onClick={() => setSelectedBorder(border.id)}
            >
              {/* Preview */}
              <div
                className={`${viewMode === 'grid' ? 'p-4' : ''} flex items-center justify-center`}
              >
                <AvatarBorderRenderer
                  border={border}
                  size={viewMode === 'grid' ? 80 : 56}
                  src="/default-avatar.png"
                />
              </div>

              {/* Info */}
              <div
                className={
                  viewMode === 'grid'
                    ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-3'
                    : 'flex-1'
                }
              >
                <p className="truncate text-sm font-medium">{border.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full bg-gradient-to-r px-2 py-0.5 text-xs ${
                      RARITY_COLORS[border.rarity] || RARITY_COLORS.common
                    }`}
                  >
                    {border.rarity}
                  </span>
                  {border.theme && <span className="text-xs text-gray-500">{border.theme}</span>}
                </div>
              </div>

              {/* Status Badge */}
              {isEquipped && (
                <div className="absolute right-2 top-2 rounded-full bg-cyan-500 px-2 py-1 text-xs font-medium">
                  Equipped
                </div>
              )}

              {!isOwned && (
                <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs">
                  🔒 {(border.coinCost ?? 0) > 0 ? `${border.coinCost} coins` : border.unlockType}
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                {isOwned ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEquip(border.id);
                    }}
                    disabled={isEquipped}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isEquipped
                        ? 'cursor-not-allowed bg-white/[0.08]'
                        : 'bg-cyan-500 hover:bg-cyan-600'
                    }`}
                  >
                    {isEquipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : (border.coinCost ?? 0) > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(border.id);
                    }}
                    disabled={purchasing}
                    className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-medium"
                  >
                    {purchasing ? 'Purchasing...' : `Buy ${border.coinCost}`}
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Unlock via {border.unlockType}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredBorders.length === 0 && (
        <div className="py-12 text-center text-gray-500">No borders match your filters</div>
      )}
    </div>
  );
}

export default AvatarBordersSection;
