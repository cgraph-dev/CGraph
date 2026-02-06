/**
 * EmojiPicker barrel export
 * @module modules/chat/components/emoji-picker
 */

export { EmojiPicker } from './EmojiPicker';
export { EmojiSearch } from './EmojiSearch';
export { CategoryTabs } from './CategoryTabs';
export { EmojiGrid } from './EmojiGrid';

// Re-export types
export type { EmojiPickerProps, EmojiCategory, EmojiCategories } from './types';

// Re-export data
export { EMOJI_CATEGORIES, INITIAL_FREQUENTLY_USED } from './emojiData';

// Re-export hooks
export { useRecentEmojis, useFilteredEmojis } from './useEmojiPicker';
