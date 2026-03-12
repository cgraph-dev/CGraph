/**
 * EquipPanel — slide-out panel for previewing and equipping cosmetic items.
 *
 * Shows full-size preview, item details, rarity badge, and equip/unequip button.
 * Renders as a right-side slide-out overlay.
 *
 * @module cosmetics/components/equip-panel
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import type { CosmeticItem } from '@cgraph/shared-types';
import { RarityBadge } from './rarity-badge';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EquipPanelProps {
  /** The item to preview (null = closed). */
  readonly item: CosmeticItem | null;
  /** Whether this item is currently equipped. */
  readonly isEquipped: boolean;
  /** Callback to equip or unequip the item. */
  readonly onToggleEquip: (item: CosmeticItem) => void;
  /** Close the panel. */
  readonly onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Slide-out equip panel.
 */
export function EquipPanel({ item, isEquipped, onToggleEquip, onClose }: EquipPanelProps) {
  const handleToggle = useCallback(() => {
    if (item) onToggleEquip(item);
  }, [item, onToggleEquip]);

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-gray-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Item Details</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Preview */}
            <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-6 py-8">
              {/* Preview image */}
              <div className="flex aspect-square w-48 items-center justify-center rounded-2xl bg-white/5">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-full w-full rounded-2xl object-contain"
                  />
                ) : (
                  <span className="text-6xl">
                    {item.type === 'border' && '🔲'}
                    {item.type === 'title' && '🏷️'}
                    {item.type === 'badge' && '🛡️'}
                    {item.type === 'nameplate' && '📛'}
                    {item.type === 'profile_effect' && '✨'}
                    {item.type === 'chat_bubble' && '💬'}
                    {item.type === 'emoji_pack' && '😀'}
                    {item.type === 'sound_pack' && '🔊'}
                    {item.type === 'theme' && '🎨'}
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="flex w-full flex-col items-center gap-3 text-center">
                <h3 className="text-xl font-bold text-white">{item.name}</h3>
                <RarityBadge rarity={item.rarity} size="md" />
                <p className="text-sm text-gray-400">{item.description}</p>

                <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                  <span className="rounded-md bg-white/5 px-2 py-1 capitalize">
                    {item.type.replace('_', ' ')}
                  </span>
                  <span className="rounded-md bg-white/5 px-2 py-1 capitalize">
                    {item.unlockType}
                  </span>
                </div>
              </div>

              {/* Currently equipped indicator */}
              {isEquipped && (
                <div className="flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
                  <span>✓</span>
                  <span>Currently Equipped</span>
                </div>
              )}
            </div>

            {/* Action footer */}
            <div className="border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={handleToggle}
                className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                  isEquipped
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-cyan-500 text-white hover:bg-cyan-600'
                }`}
              >
                {isEquipped ? 'Unequip' : 'Equip'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
