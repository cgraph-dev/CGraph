/**
 * Schemas Barrel Export
 *
 * Re-exports all validation schemas, types, and utilities
 * from their respective submodules.
 *
 * @module validation/schemas
 */

// Base schemas
export { dateTimeSchema, uuidSchema, emailSchema, paginationSchema } from './base';

// User schemas
export { userStatusSchema, userRefSchema, userSchema, type User, type UserRef } from './user';

// Auth schemas
export {
  tokensSchema,
  loginResponseSchema,
  registerResponseSchema,
  refreshResponseSchema,
  type Tokens,
  type LoginResponse,
} from './auth';

// Conversation schemas
export {
  participantSchema,
  reactionSchema,
  messageSchema,
  conversationSchema,
  conversationsListSchema,
  messagesListSchema,
  type Message,
  type Conversation,
} from './conversation';

// Notification schemas
export {
  notificationTypeSchema,
  notificationSchema,
  notificationsListSchema,
  type Notification,
} from './notification';

// Social & group schemas
export {
  friendRequestStatusSchema,
  friendSchema,
  groupRoleSchema,
  groupSchema,
  channelSchema,
  apiErrorSchema,
  type Friend,
  type Group,
  type Channel,
  type ApiError,
} from './social';

// Validation utilities
export {
  validateResponse,
  validateWithFallback,
  createValidatedFetcher,
  type ValidationResult,
} from './utils';
