/**
 * Package Integration Layer
 *
 * This module re-exports @cgraph/* packages and provides integration
 * with the web app's existing code. It serves as a bridge during the
 * migration from duplicated local code to shared packages.
 *
 * @module lib/packages
 * @version 1.0.0
 */

// ============================================================================
// @cgraph/config - Application configuration
// ============================================================================
export {
  // App constants
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  API_VERSION,

  // Pagination
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,

  // Message limits
  MAX_MESSAGE_LENGTH,
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENTS_PER_MESSAGE,

  // User limits
  MIN_USERNAME_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MAX_BIO_LENGTH,

  // Group limits
  MAX_GROUP_NAME_LENGTH,
  MAX_GROUP_DESCRIPTION_LENGTH,
  MAX_ROLES_PER_GROUP,
  MAX_CHANNELS_PER_GROUP,
  MAX_MEMBERS_PER_GROUP,

  // Forum limits
  MAX_FORUM_NAME_LENGTH,
  MAX_FORUM_DESCRIPTION_LENGTH,

  // Rate limits
  RATE_LIMITS,

  // AI config
  AI_MODELS,
  DEFAULT_AI_MODEL,
  AI_TIERS,

  // Timeouts
  TIMEOUTS,

  // Languages
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,

  // Themes
  THEME_OPTIONS,
  DEFAULT_THEME,

  // Other constants
  NOTIFICATION_TYPES,
  PRESENCE_STATUSES,
  CHANNEL_TYPES,
  FLAIR_COLORS,
  EMOJI_CATEGORIES,
  FILE_CATEGORIES,
  KEYBOARD_SHORTCUTS,
  PATTERNS,

  // Environment
  config,
} from '@cgraph/config';

// ============================================================================
// @cgraph/shared-types - Shared TypeScript types
// ============================================================================
export type {
  // Auth types
  AuthTokens,

  // User types
  User,
  UserStatus,
  Session,
  UserBasic,

  // Message types
  Message,
  MessageType,
  MessageMetadata,
  Conversation,
  ConversationType,
  ConversationParticipant,
  Reaction,
  MessageReaction,
  TypingIndicator,
  ReadReceipt,

  // Group types
  Group,
  Member,
  Role,
  Permission,
  Channel,
  ChannelCategory,
  ChannelType,
  Invite,
  GroupBasic,

  // Forum types
  Forum,
  ForumCategory,
  ForumBoard,
  ForumThread,
  ForumPost,
  ThreadPrefix,
  ForumPoll,
  ForumPollOption,
  Post,
  PostType,
  Comment,
  Vote,
  VoteValue,
  Thread,
  ThreadPost,
  Board,
  HostedForum,
  ForumMembership,
  ForumMemberRole,

  // Friendship types
  Friendship,
  FriendshipStatus,
  Friend,
  FriendRequest,
  FriendSuggestion,

  // API types
  ApiResponse,
  ApiError,

  // Event types
  SocketEvents,
  PresenceState,
  PresenceMeta,

  // Tier types
  TierName,
  TierBasic,
  TierFull,
  TierLimits,
  AIFeatures,
  TierFeatureFlags,
  UserTierInfo,
} from '@cgraph/shared-types';

// ============================================================================
// @cgraph/utils - Utility functions
// ============================================================================
export {
  // Formatting
  formatMessageTime,
  formatRelativeTime,
  formatPostTime,
  formatDateHeader,
  formatFileSize,
  formatNumber,
  formatDuration,
  truncate,
  pluralize,

  // Validation
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidUrl,
  sanitizeInput,

  // Permissions
  hasPermission,
  addPermission,
  removePermission,
  hasAllPermissions,
  hasAnyPermission,
  Permissions,

  // Helpers
  debounce,
  throttle,
  sleep,
  retry,
  generateId,
  deepClone,
  deepEqual,
  pick,
  omit,
  groupBy,

  // HTTP Client
  createHttpClient,
} from '@cgraph/utils';

// ============================================================================
// @cgraph/ui - Shared UI components
// ============================================================================
export {
  // Utilities
  cn,

  // Components
  Button,
  buttonVariants,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Avatar,
  avatarVariants,
  Badge,
  badgeVariants,
  Spinner,
  spinnerVariants,
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalClose,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
} from '@cgraph/ui';

export type { ButtonProps, InputProps, AvatarProps, BadgeProps, SpinnerProps } from '@cgraph/ui';

// ============================================================================
// @cgraph/core - Core domain logic
// ============================================================================
export * from '@cgraph/core';
