/**
 * Type definitions for StickerPicker module
 */

import type { Sticker, StickerPack, StickerRarity } from '@/data/stickers';

export interface StickerPickerProps {
  /** Callback when a sticker is selected */
  onSelect: (sticker: Sticker) => void;
  /** Callback to close the picker */
  onClose: () => void;
  /** Whether the picker is open */
  isOpen: boolean;
  /** Optional className for positioning */
  className?: string;
  /** Optional list of owned pack IDs (defaults to free packs) */
  ownedPacks?: string[];
}

export interface StickerItemProps {
  sticker: Sticker;
  onSelect: (sticker: Sticker) => void;
  isLocked: boolean;
  packPrice?: number;
}

export interface PackTabProps {
  pack: StickerPack;
  isActive: boolean;
  isOwned: boolean;
  onClick: () => void;
}

export interface StickerMessageProps {
  sticker: Sticker;
  size?: 'sm' | 'md' | 'lg';
}

export interface StickerButtonProps {
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export type { Sticker, StickerPack, StickerRarity };
