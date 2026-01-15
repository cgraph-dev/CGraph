/**
 * API Validation Module
 *
 * Provides Zod schemas for runtime validation of API responses
 * and a validated API client for type-safe API calls.
 *
 * @example
 * ```ts
 * import { validatedApi } from '@/lib/validation';
 *
 * // Type-safe API calls with runtime validation
 * const { user, tokens } = await validatedApi.auth.login(email, password);
 * const conversations = await validatedApi.conversations.list();
 * ```
 *
 * @example
 * ```ts
 * import { validateResponse, userSchema } from '@/lib/validation';
 *
 * // Manual validation
 * const result = validateResponse(userSchema, apiResponse);
 * if (result.success) {
 *   console.log(result.data.email);
 * }
 * ```
 */

// Schema exports
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
  type ValidationResult,
} from './schemas';

// Validated API client
export {
  validatedApi,
  authApi,
  conversationsApi,
  messagesApi,
  notificationsApi,
} from './validatedApi';
export { validatedApi as default } from './validatedApi';
