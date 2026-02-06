/**
 * Constants for PostIconPicker
 * @module modules/forums/components/post-icon-picker
 */

import type { PostIcon } from './types';

export const LOCAL_STORAGE_KEY = 'cgraph_recent_post_icons';
export const MAX_RECENT_ICONS = 8;

export const SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const GRID_SIZES = {
  sm: 'grid-cols-6 gap-1',
  md: 'grid-cols-8 gap-2',
  lg: 'grid-cols-10 gap-2',
};

export const BUTTON_SIZES = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

export const ICON_DISPLAY_SIZES = {
  sm: 'xs' as const,
  md: 'sm' as const,
  lg: 'md' as const,
};

/**
 * Default emoji-based icons as fallback
 */
export function getDefaultIcons(): PostIcon[] {
  const defaults = [
    { name: 'Default', emoji: '💬' },
    { name: 'Question', emoji: '❓' },
    { name: 'Exclamation', emoji: '❗' },
    { name: 'Lightbulb', emoji: '💡' },
    { name: 'Star', emoji: '⭐' },
    { name: 'Heart', emoji: '❤️' },
    { name: 'Check', emoji: '✅' },
    { name: 'Warning', emoji: '⚠️' },
    { name: 'Info', emoji: 'ℹ️' },
    { name: 'Thumbs Up', emoji: '👍' },
    { name: 'Thumbs Down', emoji: '👎' },
    { name: 'Fire', emoji: '🔥' },
    { name: 'Cool', emoji: '😎' },
    { name: 'Sad', emoji: '😢' },
    { name: 'Angry', emoji: '😠' },
    { name: 'Thinking', emoji: '🤔' },
  ];

  return defaults.map((d, i) => ({
    id: `default-${i}`,
    name: d.name,
    icon_url: '',
    emoji: d.emoji,
    display_order: i,
    is_active: true,
    usage_count: 0,
  }));
}
