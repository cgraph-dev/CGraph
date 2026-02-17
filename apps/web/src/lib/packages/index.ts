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
