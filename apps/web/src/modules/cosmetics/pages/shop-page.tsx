/**
 * Shop Page — browse and purchase cosmetic items organized by type.
 *
 * Sections for all cosmetic types: badges, nameplates, profile effects,
 * profile frames, borders, titles, chat bubbles, emoji packs, sound packs, themes.
 * Each section shows a horizontal scroll of items with purchase/equip actions.
 *
 * @module cosmetics/pages/shop-page
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';

import type { CosmeticItem, CosmeticType, UserCosmeticInventory } from '@cgraph/shared-types';
import { CosmeticCard } from '../components/cosmetic-card';
import { EquipPanel } from '../components/equip-panel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHOP_SECTIONS: { type: CosmeticType; label: string; icon: string }[] = [
  { type: 'badge', label: 'Badges', icon: '🛡️' },
  { type: 'nameplate', label: 'Nameplates', icon: '📛' },
  { type: 'profile_effect', label: 'Profile Effects', icon: '✨' },
  { type: 'border', label: 'Avatar Borders', icon: '🔲' },
  { type: 'title', label: 'Titles', icon: '🏷️' },
  { type: 'chat_bubble', label: 'Chat Bubbles', icon: '💬' },
  { type: 'emoji_pack', label: 'Emoji Packs', icon: '😀' },
  { type: 'sound_pack', label: 'Sound Packs', icon: '🔊' },
  { type: 'theme', label: 'Themes', icon: '🎨' },
];

// ---------------------------------------------------------------------------
// Stub data (wired to real API in future phase)
// ---------------------------------------------------------------------------

const STUB_CATALOGUE: CosmeticItem[] = [];
const STUB_INVENTORY: UserCosmeticInventory[] = [];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ShopPageProps {
  /** Full cosmetic catalogue. */
  readonly catalogue?: CosmeticItem[];
  /** User's owned inventory. */
  readonly inventory?: UserCosmeticInventory[];
  /** Equip callback. */
  readonly onEquip?: (item: CosmeticItem) => void;
  /** Unequip callback. */
  readonly onUnequip?: (item: CosmeticItem) => void;
}

/**
 * Shop Page component.
 */
export function ShopPage({
  catalogue = STUB_CATALOGUE,
  inventory = STUB_INVENTORY,
  onEquip,
  onUnequip,
}: ShopPageProps) {
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

  // Build lookup sets
  const ownedIds = useMemo(() => new Set(inventory.map((e) => e.cosmetic.id)), [inventory]);
  const equippedIds = useMemo(
    () => new Set(inventory.filter((e) => e.equipped).map((e) => e.cosmetic.id)),
    [inventory]
  );

  // Group catalogue by type
  const itemsByType = useMemo(() => {
    const map = new Map<CosmeticType, CosmeticItem[]>();
    for (const item of catalogue) {
      const list = map.get(item.type) ?? [];
      list.push(item);
      map.set(item.type, list);
    }
    return map;
  }, [catalogue]);

  const handleToggleEquip = useCallback(
    (item: CosmeticItem) => {
      if (equippedIds.has(item.id)) {
        onUnequip?.(item);
      } else {
        onEquip?.(item);
      }
      setSelectedItem(null);
    },
    [equippedIds, onEquip, onUnequip]
  );

  return (
    <div className="min-h-screen bg-black/95 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-3xl font-bold text-transparent">
            Cosmetics Shop
          </h1>
          <p className="mt-1 text-sm text-gray-400">Discover and equip unique cosmetic items</p>
        </div>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        {SHOP_SECTIONS.map((section) => {
          const items = itemsByType.get(section.type) ?? [];

          return (
            <motion.section
              key={section.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Section header */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <h2 className="text-xl font-semibold text-white">{section.label}</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">
                  {items.length}
                </span>
              </div>

              {/* Horizontal scroll grid */}
              {items.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {items.map((item) => (
                    <CosmeticCard
                      key={item.id}
                      item={item}
                      owned={ownedIds.has(item.id)}
                      equipped={equippedIds.has(item.id)}
                      onSelect={setSelectedItem}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-600">
                  No {section.label.toLowerCase()} available yet
                </div>
              )}
            </motion.section>
          );
        })}
      </div>

      {/* Equip panel */}
      <EquipPanel
        item={selectedItem}
        isEquipped={selectedItem ? equippedIds.has(selectedItem.id) : false}
        onToggleEquip={handleToggleEquip}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
