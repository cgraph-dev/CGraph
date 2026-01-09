/**
 * Conversation Component Constants
 * 
 * Centralized constants for conversation UI elements.
 * These constants are used across multiple conversation components.
 * 
 * @module components/conversation/constants
 * @since v0.7.29
 */

/**
 * Wave emoji options for empty conversation greetings.
 * Used in the EmptyConversation component for playful interactions.
 */
export const WAVE_EMOJIS = ['👋', '✨', '💬', '🎉', '🌟'] as const;

/**
 * Quick reaction emojis displayed in the message actions menu.
 * Most commonly used reactions for fast access.
 */
export const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'] as const;

/**
 * Full emoji picker categories with comprehensive emoji sets.
 * Organized by semantic category for intuitive navigation.
 */
export const EMOJI_CATEGORIES = {
  Smileys: [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
    '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
    '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  ],
  Gestures: [
    '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞',
    '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️',
    '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️',
  ],
  Hearts: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
  ],
  Symbols: [
    '✨', '⭐', '🌟', '💫', '🔥', '💯', '💢', '💥', '💦', '💨',
    '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🎵', '🎶',
  ],
} as const;

export type EmojiCategory = keyof typeof EMOJI_CATEGORIES;

/**
 * Action item configuration for message context menus.
 * Defines the available actions with their visual properties.
 */
export interface ActionItemConfig {
  id: string;
  icon: string;
  label: string;
  color: string;
  gradient: [string, string];
  visible: boolean;
  danger?: boolean;
}

/**
 * Default action color palette for message actions.
 */
export const ACTION_COLORS = {
  reply: '#3b82f6',
  copy: '#8b5cf6',
  pin: '#10b981',
  unpin: '#f59e0b',
  delete: '#ef4444',
} as const;
