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
