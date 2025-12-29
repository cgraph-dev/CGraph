/**
 * Application constants
 */

// App Info
export const APP_NAME = 'CGraph';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'The Everything App for Web3 Communities';

// API Versions
export const API_VERSION = 'v1';

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// Message Limits
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_ATTACHMENT_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

// Post Limits
export const MAX_POST_TITLE_LENGTH = 300;
export const MAX_POST_CONTENT_LENGTH = 40000;
export const MAX_COMMENT_LENGTH = 10000;

// User Limits
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_BIO_LENGTH = 500;

// Group Limits
export const MAX_GROUP_NAME_LENGTH = 100;
export const MAX_GROUP_DESCRIPTION_LENGTH = 1000;
export const MAX_ROLES_PER_GROUP = 100;
export const MAX_CHANNELS_PER_GROUP = 500;
export const MAX_MEMBERS_PER_GROUP = 100000;

// Forum Limits
export const MAX_FORUM_NAME_LENGTH = 100;
export const MAX_FORUM_DESCRIPTION_LENGTH = 1000;

// Rate Limits (requests per window)
export const RATE_LIMITS = {
  messages: { max: 50, windowSeconds: 10 },
  reactions: { max: 100, windowSeconds: 60 },
  posts: { max: 10, windowSeconds: 60 },
  comments: { max: 30, windowSeconds: 60 },
  auth: { max: 5, windowSeconds: 60 },
  upload: { max: 10, windowSeconds: 60 },
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  api: 30000,
  upload: 120000,
  websocket: 10000,
  typing: 3000,
  reconnect: 5000,
} as const;

// Supported Languages
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko'] as const;
export const DEFAULT_LANGUAGE = 'en';

// Theme Options
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const;
export const DEFAULT_THEME = 'system';

// Notification Types
export const NOTIFICATION_TYPES = [
  'message',
  'mention',
  'reply',
  'reaction',
  'group_invite',
  'friend_request',
  'system',
] as const;

// Presence Status Options
export const PRESENCE_STATUSES = ['online', 'idle', 'dnd', 'offline', 'invisible'] as const;

// Channel Types
export const CHANNEL_TYPES = ['text', 'voice', 'announcements', 'stage'] as const;

// Post Flair Colors
export const FLAIR_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6b7280', // gray
] as const;

// Emoji Categories
export const EMOJI_CATEGORIES = [
  'recent',
  'smileys',
  'people',
  'nature',
  'food',
  'activities',
  'travel',
  'objects',
  'symbols',
  'flags',
] as const;

// File Type Categories
export const FILE_CATEGORIES = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'],
  video: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  code: ['js', 'ts', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'json', 'xml', 'yaml'],
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  sendMessage: ['Enter'],
  newLine: ['Shift+Enter'],
  search: ['Ctrl+K', 'Cmd+K'],
  settings: ['Ctrl+,', 'Cmd+,'],
  toggleSidebar: ['Ctrl+B', 'Cmd+B'],
  previousChannel: ['Alt+Up'],
  nextChannel: ['Alt+Down'],
  markAsRead: ['Escape'],
} as const;

// Regex Patterns
export const PATTERNS = {
  mention: /@(\w+)/g,
  channel: /#(\w+)/g,
  emoji: /:(\w+):/g,
  url: /(https?:\/\/[^\s]+)/g,
  code: /`([^`]+)`/g,
  codeBlock: /```(\w*)\n([\s\S]*?)```/g,
} as const;
