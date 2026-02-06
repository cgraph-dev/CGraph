/**
 * Emoji Picker Module
 *
 * Comprehensive emoji picker for chat message input with categorized
 * emoji grid, real-time search, frequently used tracking, and
 * smooth selection animations.
 *
 * @module modules/chat/components/emoji-picker
 */

// Main component
export { EmojiPicker } from './EmojiPicker';

// Sub-components
export { EmojiSearch } from './EmojiSearch';
export { CategoryTabs } from './CategoryTabs';
export { EmojiGrid } from './EmojiGrid';

// Hooks
export { useRecentEmojis, useFilteredEmojis } from './useEmojiPicker';

// Types
export type { EmojiPickerProps, EmojiCategory, EmojiCategories } from './types';

// Data & Constants
export { EMOJI_CATEGORIES, INITIAL_FREQUENTLY_USED } from './emojiData';
