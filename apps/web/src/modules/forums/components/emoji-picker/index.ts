/**
 * Custom Emoji Picker Module
 *
 * @module components/forums/emoji-picker
 */

// Types
export type { CustomEmoji, EmojiCategory, CustomEmojiPickerProps } from './types';

// Hooks
export { useCustomEmojis, useEmojiSearch } from './hooks';

// Components
export {
  EmojiButton,
  UnicodeEmojiButton,
  CategoryTab,
  SearchInput,
  EmptyState,
} from './components';

// Data
export { UNICODE_CATEGORIES } from './unicode-emojis';

// Main component
export { CustomEmojiPicker, default } from './custom-emoji-picker';
