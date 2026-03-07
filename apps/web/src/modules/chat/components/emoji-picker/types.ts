/**
 * Type definitions for EmojiPicker component
 * @module modules/chat/components/emoji-picker
 */

export interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  className?: string;
}

export type EmojiCategory =
  | 'Frequently Used'
  | 'Smileys & People'
  | 'Gestures'
  | 'Hearts & Love'
  | 'Animals & Nature'
  | 'Food & Drink'
  | 'Activities'
  | 'Travel & Places'
  | 'Objects'
  | 'Symbols'
  | 'Flags';

export type EmojiCategories = Record<EmojiCategory, string[]>;

/** Enriched emoji item with optional Lottie animation metadata. */
export interface EmojiItem {
  /** The emoji character. */
  emoji: string;
  /** Human-readable name. */
  name: string;
  /** Category grouping. */
  category: string;
  /** Search keywords. */
  keywords: string[];
  /** Whether this emoji has a Lottie animation. */
  hasAnimation?: boolean;
  /** CDN URLs for animated/static versions. */
  animations?: {
    /** URL to lottie.json. */
    lottie: string;
    /** URL to static WebP fallback. */
    webp: string;
    /** URL to animated GIF fallback. */
    gif: string;
  };
}
