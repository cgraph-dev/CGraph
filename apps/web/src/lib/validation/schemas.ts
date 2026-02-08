/**
 * API Response Validation with Zod
 *
 * Thin re-export barrel — all schemas, types, and utilities are defined
 * in the `./schemas/` submodules.
 *
 * @module apiValidation
 */

export {
  // Base schemas
  dateTimeSchema,
  uuidSchema,
  emailSchema,
  paginationSchema,
  // User schemas
  userStatusSchema,
  userRefSchema,
  userSchema,
  // Auth schemas
  tokensSchema,
  loginResponseSchema,
  registerResponseSchema,
  refreshResponseSchema,
  // Conversation schemas
  participantSchema,
  reactionSchema,
  messageSchema,
  conversationSchema,
  conversationsListSchema,
  messagesListSchema,
  // Notification schemas
  notificationTypeSchema,
  notificationSchema,
  notificationsListSchema,
  // Friend schemas
  friendRequestStatusSchema,
  friendSchema,
  // Group schemas
  groupRoleSchema,
  groupSchema,
  channelSchema,
  // Error schemas
  apiErrorSchema,
  // Validation utilities
  validateResponse,
  validateWithFallback,
  createValidatedFetcher,
  // Type exports
  type ValidationResult,
  type User,
  type UserRef,
  type Tokens,
  type LoginResponse,
  type Message,
  type Conversation,
  type Notification,
  type Friend,
  type Group,
  type Channel,
  type ApiError,
} from './schemas/index';
