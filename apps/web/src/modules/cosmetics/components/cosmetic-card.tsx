/**
 * CosmeticCard — grid card for displaying a single cosmetic item.
 *
 * Shows: thumbnail, name, RarityBadge, equipped/locked indicator.
 * Supports click-to-select for the equip panel.
 *
 * @module cosmetics/components/cosmetic-card
 */

import type { CosmeticItem } from '@cgraph/shared-types';
import { RarityBadge } from './rarity-badge';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CosmeticCardProps {
  /** The cosmetic item to display. */
  readonly item: CosmeticItem;
  /** Whether the user owns this item. */
  readonly owned: boolean;
  /** Whether this item is currently equipped. */
  readonly equipped: boolean;
  /** Click handler for selecting the card. */
  readonly onSelect?: (item: CosmeticItem) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Grid card for a cosmetic item with status indicators.
 */
export function CosmeticCard({ item, owned, equipped, onSelect }: CosmeticCardProps) {
  const isLocked = !owned;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 ${
        equipped
          ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
          : isLocked
            ? 'border-white/5 bg-white/[0.02] opacity-60 hover:opacity-80'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
      }`}
    >
      {/* Thumbnail area */}
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-white/5 to-transparent p-4">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
            {item.type === 'border' && '🔲'}
            {item.type === 'title' && '🏷️'}
            {item.type === 'badge' && '🛡️'}
            {item.type === 'nameplate' && '📛'}
            {item.type === 'profile_effect' && '✨'}
            {item.type === 'chat_bubble' && '💬'}
            {item.type === 'emoji_pack' && '😀'}
            {item.type === 'sound_pack' && '🔊'}
            {item.type === 'theme' && '🎨'}
          </div>
        )}

        {/* Equipped indicator */}
        {equipped && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-xs text-white shadow-lg">
            ✓
          </div>
        )}

        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-2xl">🔒</span>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="flex flex-1 flex-col gap-1 px-3 py-2">
        <span className="truncate text-sm font-medium text-white">{item.name}</span>
        <div className="flex items-center justify-between">
          <RarityBadge rarity={item.rarity} />
          <span className="text-[10px] capitalize text-gray-500">
            {item.type.replace('_', ' ')}
          </span>
        </div>
      </div>
    </button>
  );
}
