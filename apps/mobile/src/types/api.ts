/**
 * Standardized API Response Types
 *
 * Provides consistent wrapper types for all API responses.
 * This ensures uniform error handling and data access patterns
 * throughout the mobile application.
 *
 * @module types/api
 * @since v0.7.29
 */

import type {
  User,
  UserBasic,
  Message,
  Conversation,
  Group,
  Channel,
  Forum,
  Post,
  Comment,
  Friend,
  FriendRequest,
  Member,
} from './index';

// ============================================================================
// Base Response Types
// ============================================================================

/**
 * Standard API error structure
 */
export interface ApiError {
  /** Error message suitable for display */
  message: string;
  /** Machine-readable error code */
  code?: string;
  /** HTTP status code */
  status?: number;
  /** Field-specific validation errors */
  errors?: Record<string, string[]>;
  /** Additional error context */
  details?: Record<string, unknown>;
}

/**
 * Base response wrapper for single item endpoints
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Error information (present on failure) */
  error?: ApiError;
  /** Optional informational message */
  message?: string;
}

/**
 * Paginated response wrapper for list endpoints
 */
export interface PaginatedResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Array of items */
  data?: T[];
  /** Pagination metadata */
  pagination?: PaginationMeta;
  /** Error information (present on failure) */
  error?: ApiError;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  per_page: number;
  /** Total number of items */
  total_count: number;
  /** Total number of pages */
  total_pages: number;
  /** Whether there are more pages */
  has_more: boolean;
  /** Cursor for next page (if using cursor-based pagination) */
  next_cursor?: string;
  /** Cursor for previous page */
  prev_cursor?: string;
}

// ============================================================================
// Authentication Responses
// ============================================================================

export type LoginResponse = ApiResponse<{
  user: User;
  token: string;
  refresh_token?: string;
  expires_at?: string;
}>;

export type RegisterResponse = ApiResponse<{
  user: User;
  token: string;
  requires_verification?: boolean;
}>;

export type RefreshTokenResponse = ApiResponse<{
  token: string;
  expires_at: string;
}>;

export type LogoutResponse = ApiResponse<{
  logged_out: boolean;
}>;

// ============================================================================
// User Responses
// ============================================================================

export type GetUserResponse = ApiResponse<User>;

export type UpdateUserResponse = ApiResponse<User>;

export type SearchUsersResponse = PaginatedResponse<UserBasic>;

export type GetUserProfileResponse = ApiResponse<{
  user: User;
  mutual_friends_count?: number;
  is_friend?: boolean;
  friendship_status?: 'none' | 'pending' | 'accepted' | 'blocked';
}>;

// ============================================================================
// Conversation Responses
// ============================================================================

export type GetConversationsResponse = PaginatedResponse<Conversation>;

export type GetConversationResponse = ApiResponse<Conversation>;

export type CreateConversationResponse = ApiResponse<Conversation>;

export type DeleteConversationResponse = ApiResponse<{
  deleted: boolean;
}>;

// ============================================================================
// Message Responses
// ============================================================================

export type GetMessagesResponse = PaginatedResponse<Message>;

export type SendMessageResponse = ApiResponse<Message>;

export type EditMessageResponse = ApiResponse<Message>;

export type DeleteMessageResponse = ApiResponse<{
  deleted: boolean;
}>;

export type PinMessageResponse = ApiResponse<Message>;

export type AddReactionResponse = ApiResponse<Message>;

export type RemoveReactionResponse = ApiResponse<Message>;

// ============================================================================
// Friend Responses
// ============================================================================

export type GetFriendsResponse = PaginatedResponse<Friend>;

export type GetFriendRequestsResponse = PaginatedResponse<FriendRequest>;

export type SendFriendRequestResponse = ApiResponse<{
  request_id: string;
  status: 'sent' | 'already_friends' | 'already_pending';
}>;

export type AcceptFriendRequestResponse = ApiResponse<Friend>;

export type DeclineFriendRequestResponse = ApiResponse<{
  declined: boolean;
}>;

export type RemoveFriendResponse = ApiResponse<{
  removed: boolean;
}>;

export type BlockUserResponse = ApiResponse<{
  blocked: boolean;
}>;

// ============================================================================
// Group Responses
// ============================================================================

export type GetGroupsResponse = PaginatedResponse<Group>;

export type GetGroupResponse = ApiResponse<Group>;

export type CreateGroupResponse = ApiResponse<Group>;

export type UpdateGroupResponse = ApiResponse<Group>;

export type DeleteGroupResponse = ApiResponse<{
  deleted: boolean;
}>;

export type JoinGroupResponse = ApiResponse<{
  member: Member;
}>;

export type LeaveGroupResponse = ApiResponse<{
  left: boolean;
}>;

// ============================================================================
// Channel Responses
// ============================================================================

export type GetChannelResponse = ApiResponse<Channel>;

export type CreateChannelResponse = ApiResponse<Channel>;

export type UpdateChannelResponse = ApiResponse<Channel>;

export type DeleteChannelResponse = ApiResponse<{
  deleted: boolean;
}>;

export type GetChannelMessagesResponse = PaginatedResponse<Message>;

// ============================================================================
// Forum Responses
// ============================================================================

export type GetForumsResponse = PaginatedResponse<Forum>;

export type GetForumResponse = ApiResponse<Forum>;

export type CreateForumResponse = ApiResponse<Forum>;

// ============================================================================
// Post Responses
// ============================================================================

export type GetPostsResponse = PaginatedResponse<Post>;

export type GetPostResponse = ApiResponse<Post>;

export type CreatePostResponse = ApiResponse<Post>;

export type UpdatePostResponse = ApiResponse<Post>;

export type DeletePostResponse = ApiResponse<{
  deleted: boolean;
}>;

export type VotePostResponse = ApiResponse<{
  vote_count: number;
  my_vote: 1 | -1 | null;
}>;

// ============================================================================
// Comment Responses
// ============================================================================

export type GetCommentsResponse = PaginatedResponse<Comment>;

export type CreateCommentResponse = ApiResponse<Comment>;

export type UpdateCommentResponse = ApiResponse<Comment>;

export type DeleteCommentResponse = ApiResponse<{
  deleted: boolean;
}>;

export type VoteCommentResponse = ApiResponse<{
  vote_count: number;
  my_vote: 1 | -1 | null;
}>;

// ============================================================================
// Upload Responses
// ============================================================================

export type UploadFileResponse = ApiResponse<{
  url: string;
  filename: string;
  size: number;
  mime_type: string;
  thumbnail_url?: string;
}>;

export type UploadAvatarResponse = ApiResponse<{
  avatar_url: string;
}>;

// ============================================================================
// Notification Responses
// ============================================================================

export interface Notification {
  id: string;
  type: 'friend_request' | 'message' | 'mention' | 'reaction' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  inserted_at: string;
}

export type GetNotificationsResponse = PaginatedResponse<Notification>;

export type MarkNotificationReadResponse = ApiResponse<{
  marked: boolean;
}>;

export type MarkAllNotificationsReadResponse = ApiResponse<{
  count: number;
}>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { error: ApiError } {
  return response.success === false && response.error !== undefined;
}

/**
 * Type guard to check if a paginated response has more pages
 */
export function hasMorePages<T>(response: PaginatedResponse<T>): boolean {
  return response.pagination?.has_more === true;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Common pagination parameters for list endpoints
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
  cursor?: string;
}

/**
 * Common sort parameters
 */
export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Message creation request
 */
export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video';
  attachments?: Array<{
    type: 'image' | 'file' | 'audio' | 'video';
    url: string;
    filename: string;
    size: number;
    mime_type: string;
    metadata?: Record<string, unknown>;
  }>;
  reply_to_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Post creation request
 */
export interface CreatePostRequest {
  title: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'poll';
  flair_id?: string;
  attachments?: string[];
}
