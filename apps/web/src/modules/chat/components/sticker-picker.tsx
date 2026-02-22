/**
 * StickerPicker Component
 *
 * A comprehensive sticker selection interface for chat messaging.
 * Features animated sticker display, pack management, rarity styling,
 * search functionality, and integration with the coin-based purchase system.
 *
 * @module StickerPicker
 * @see ./sticker-picker for modular implementation
 */

export {
  // Types
  type StickerPickerProps,
  type StickerItemProps,
  type PackTabProps,
  type StickerMessageProps,
  type StickerButtonProps,
  type Sticker,
  type StickerPack,
  type StickerRarity,
  // Constants
  ANIMATION_CONFIGS,
  RARITY_ICONS,
  STICKER_SIZE_CLASSES,
  // Components
  StickerItem,
  PackTab,
  StickerMessage,
  StickerButton,
  StickerPicker,
  default,
} from './sticker-picker/index';
