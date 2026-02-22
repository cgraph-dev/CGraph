/**
 * ConversationScreen Constants
 *
 * Constant values used across conversation screen components.
 *
 * @module screens/messages/ConversationScreen
 */

import { Dimensions } from 'react-native';

// =============================================================================
// Screen Dimensions
// =============================================================================

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// Animation Constants
// =============================================================================

export const ANIMATION_CONFIG = {
  spring: {
    tension: 100,
    friction: 12,
  },
  timing: {
    short: 150,
    medium: 300,
    long: 500,
  },
} as const;

// =============================================================================
// Emoji Constants
// =============================================================================

/** Fun waving emojis for empty conversation */
export const WAVE_EMOJIS = ['👋', '✨', '💬', '🎉', '🌟'] as const;

/** Quick reaction emojis - most commonly used */
export const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'] as const;

/** Full emoji picker categories */
export const EMOJI_CATEGORIES = {
  Smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😜',
    '🤪',
    '😝',
    '🤗',
    '🤭',
    '🤫',
    '🤔',
    '🤐',
    '🤨',
    '😐',
    '😑',
    '😶',
    '😏',
    '😒',
    '🙄',
    '😬',
    '🤥',
  ],
  Gestures: [
    '👍',
    '👎',
    '👏',
    '🙌',
    '👐',
    '🤲',
    '🤝',
    '🙏',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '👌',
    '🤌',
    '🤏',
    '👈',
    '👉',
    '👆',
    '👇',
    '☝️',
    '✋',
    '🤚',
    '🖐️',
    '🖖',
    '👋',
    '🤙',
    '💪',
    '🦾',
    '🖕',
    '✍️',
  ],
  Hearts: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
    '♥️',
  ],
  Symbols: [
    '✨',
    '⭐',
    '🌟',
    '💫',
    '🔥',
    '💯',
    '💢',
    '💥',
    '💦',
    '💨',
    '🕳️',
    '💣',
    '💬',
    '👁️‍🗨️',
    '🗨️',
    '🗯️',
    '💭',
    '💤',
    '🎵',
    '🎶',
  ],
} as const;

// =============================================================================
// Message Display Constants
// =============================================================================

export const MESSAGE_CONSTANTS = {
  /** Maximum width for message bubbles as percentage of screen width */
  maxBubbleWidth: 0.75,
  /** Minimum time between messages to show timestamp (in ms) */
  timestampInterval: 5 * 60 * 1000, // 5 minutes
  /** Number of messages to load per page */
  pageSize: 30,
  /** Auto-scroll threshold (pixels from bottom) */
  autoScrollThreshold: 100,
} as const;

// =============================================================================
// Media Constants
// =============================================================================

export const MEDIA_CONSTANTS = {
  /** Maximum file size for attachments (10MB) */
  maxFileSize: 10 * 1024 * 1024,
  /** Maximum video duration in seconds */
  maxVideoDuration: 60,
  /** Maximum voice message duration in seconds */
  maxVoiceDuration: 120,
  /** Supported image types */
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  /** Supported video types */
  supportedVideoTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
} as const;
