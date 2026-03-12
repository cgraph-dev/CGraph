/**
 * Inventory Page — browse and manage owned cosmetic items.
 *
 * Features:
 * - Type filter tabs (all / border / title / badge / nameplate / ...)
 * - Rarity filter dropdown
 * - CSS grid of CosmeticCard components
 * - Equipped indicator on cards
 *
 * @module cosmetics/pages/inventory-page
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import type { CosmeticItem, CosmeticType, UserCosmeticInventory } from '@cgraph/shared-types';
import { RARITY_TIERS } from '@cgraph/shared-types';
import type { RarityTier } from '@cgraph/shared-types';

import { CosmeticCard } from '../components/cosmetic-card';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_TABS: { id: CosmeticType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'border', label: 'Borders' },
  { id: 'title', label: 'Titles' },
  { id: 'badge', label: 'Badges' },
  { id: 'nameplate', label: 'Nameplates' },
  { id: 'profile_effect', label: 'Effects' },
  { id: 'profile_frame', label: 'Frames' },
  { id: 'name_style', label: 'Name Styles' },
  { id: 'chat_bubble', label: 'Chat Bubbles' },
  { id: 'emoji_pack', label: 'Emoji Packs' },
  { id: 'sound_pack', label: 'Sound Packs' },
  { id: 'theme', label: 'Themes' },
];

// ---------------------------------------------------------------------------
// Stub data (wired to real API in future phase)
// ---------------------------------------------------------------------------

const STUB_INVENTORY: UserCosmeticInventory[] = [];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InventoryPageProps {
  /** Optional pre-loaded inventory. Falls back to stub. */
  readonly inventory?: UserCosmeticInventory[];
  /** Callback when user selects a card to view/equip. */
  readonly onSelectItem?: (item: CosmeticItem) => void;
}

/**
 * Inventory Page component.
 */
export function InventoryPage({ inventory = STUB_INVENTORY, onSelectItem }: InventoryPageProps) {
  const [activeType, setActiveType] = useState<CosmeticType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<RarityTier | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // -------------------------------------------------------------------------
  // Filtered items
  // -------------------------------------------------------------------------

  const filteredItems = useMemo(() => {
    return inventory.filter((entry) => {
      const item = entry.cosmetic;
      if (activeType !== 'all' && item.type !== activeType) return false;
      if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [inventory, activeType, rarityFilter, searchQuery]);

  const handleSelect = useCallback(
    (item: CosmeticItem) => {
      onSelectItem?.(item);
    },
    [onSelectItem]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-black/95 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            My Inventory
          </h1>
          <p className="mt-1 text-sm text-gray-400">{inventory.length} items collected</p>
        </div>

        {/* Type tabs */}
        <div className="mx-auto max-w-7xl overflow-x-auto px-6">
          <div className="flex gap-1 pb-2">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id)}
                className={`relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-all ${
                  activeType === tab.id ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {activeType === tab.id && (
                  <motion.div
                    layoutId="inventoryTab"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-cyan-400"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar: search + rarity filter */}
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search cosmetics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
          />

          {/* Rarity dropdown */}
          <select
            value={rarityFilter}
            onChange={(e) => {
              const val = e.target.value;
              const validTiers: ReadonlyArray<string> = [...RARITY_TIERS, 'all'];
              if (validTiers.includes(val)) {
                setRarityFilter(
                  val === 'all' ? 'all' : (RARITY_TIERS.find((t) => t === val) ?? 'all')
                );
              }
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Rarities</option>
            {RARITY_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </option>
            ))}
          </select>

          {/* Item count */}
          <span className="ml-auto text-sm text-gray-500">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-6 pb-12">
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              {filteredItems.map((entry) => (
                <motion.div
                  key={entry.cosmetic.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <CosmeticCard
                    item={entry.cosmetic}
                    owned
                    equipped={entry.equipped}
                    onSelect={handleSelect}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <span className="text-5xl">📦</span>
              <p className="mt-4 text-lg font-medium text-gray-400">No items found</p>
              <p className="mt-1 text-sm text-gray-600">
                {inventory.length === 0
                  ? 'Visit the shop to start collecting cosmetics!'
                  : 'Try adjusting your filters.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default InventoryPage;
