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
  Role,
  Flair,
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

export interface LoginResponse extends ApiResponse<{
  user: User;
  token: string;
  refresh_token?: string;
  expires_at?: string;
}> {}

export interface RegisterResponse extends ApiResponse<{
  user: User;
  token: string;
  requires_verification?: boolean;
}> {}

export interface RefreshTokenResponse extends ApiResponse<{
  token: string;
  expires_at: string;
}> {}

export interface LogoutResponse extends ApiResponse<{
  logged_out: boolean;
}> {}

// ============================================================================
// User Responses
// ============================================================================

export interface GetUserResponse extends ApiResponse<User> {}

export interface UpdateUserResponse extends ApiResponse<User> {}

export interface SearchUsersResponse extends PaginatedResponse<UserBasic> {}

export interface GetUserProfileResponse extends ApiResponse<{
  user: User;
  mutual_friends_count?: number;
  is_friend?: boolean;
  friendship_status?: 'none' | 'pending' | 'accepted' | 'blocked';
}> {}

// ============================================================================
// Conversation Responses
// ============================================================================

export interface GetConversationsResponse extends PaginatedResponse<Conversation> {}

export interface GetConversationResponse extends ApiResponse<Conversation> {}

export interface CreateConversationResponse extends ApiResponse<Conversation> {}

export interface DeleteConversationResponse extends ApiResponse<{
  deleted: boolean;
}> {}

// ============================================================================
// Message Responses
// ============================================================================

export interface GetMessagesResponse extends PaginatedResponse<Message> {}

export interface SendMessageResponse extends ApiResponse<Message> {}

export interface EditMessageResponse extends ApiResponse<Message> {}

export interface DeleteMessageResponse extends ApiResponse<{
  deleted: boolean;
}> {}

export interface PinMessageResponse extends ApiResponse<Message> {}

export interface AddReactionResponse extends ApiResponse<Message> {}

export interface RemoveReactionResponse extends ApiResponse<Message> {}

// ============================================================================
// Friend Responses
// ============================================================================

export interface GetFriendsResponse extends PaginatedResponse<Friend> {}

export interface GetFriendRequestsResponse extends PaginatedResponse<FriendRequest> {}

export interface SendFriendRequestResponse extends ApiResponse<{
  request_id: string;
  status: 'sent' | 'already_friends' | 'already_pending';
}> {}

export interface AcceptFriendRequestResponse extends ApiResponse<Friend> {}

export interface DeclineFriendRequestResponse extends ApiResponse<{
  declined: boolean;
}> {}

export interface RemoveFriendResponse extends ApiResponse<{
  removed: boolean;
}> {}

export interface BlockUserResponse extends ApiResponse<{
  blocked: boolean;
}> {}

// ============================================================================
// Group Responses
// ============================================================================

export interface GetGroupsResponse extends PaginatedResponse<Group> {}

export interface GetGroupResponse extends ApiResponse<Group> {}

export interface CreateGroupResponse extends ApiResponse<Group> {}

export interface UpdateGroupResponse extends ApiResponse<Group> {}

export interface DeleteGroupResponse extends ApiResponse<{
  deleted: boolean;
}> {}

export interface JoinGroupResponse extends ApiResponse<{
  member: Member;
}> {}

export interface LeaveGroupResponse extends ApiResponse<{
  left: boolean;
}> {}

// ============================================================================
// Channel Responses
// ============================================================================

export interface GetChannelResponse extends ApiResponse<Channel> {}

export interface CreateChannelResponse extends ApiResponse<Channel> {}

export interface UpdateChannelResponse extends ApiResponse<Channel> {}

export interface DeleteChannelResponse extends ApiResponse<{
  deleted: boolean;
}> {}

export interface GetChannelMessagesResponse extends PaginatedResponse<Message> {}

// ============================================================================
// Forum Responses
// ============================================================================

export interface GetForumsResponse extends PaginatedResponse<Forum> {}

export interface GetForumResponse extends ApiResponse<Forum> {}

export interface CreateForumResponse extends ApiResponse<Forum> {}

// ============================================================================
// Post Responses
// ============================================================================

export interface GetPostsResponse extends PaginatedResponse<Post> {}

export interface GetPostResponse extends ApiResponse<Post> {}

export interface CreatePostResponse extends ApiResponse<Post> {}

export interface UpdatePostResponse extends ApiResponse<Post> {}

export interface DeletePostResponse extends ApiResponse<{
  deleted: boolean;
}> {}

export interface VotePostResponse extends ApiResponse<{
  vote_count: number;
  my_vote: 1 | -1 | null;
}> {}

// ============================================================================
// Comment Responses
// ============================================================================

export interface GetCommentsResponse extends PaginatedResponse<Comment> {}

export interface CreateCommentResponse extends ApiResponse<Comment> {}

export interface UpdateCommentResponse extends ApiResponse<Comment> {}

export interface DeleteCommentResponse extends ApiResponse<{
  deleted: boolean;
}> {}

export interface VoteCommentResponse extends ApiResponse<{
  vote_count: number;
  my_vote: 1 | -1 | null;
}> {}

// ============================================================================
// Upload Responses
// ============================================================================

export interface UploadFileResponse extends ApiResponse<{
  url: string;
  filename: string;
  size: number;
  mime_type: string;
  thumbnail_url?: string;
}> {}

export interface UploadAvatarResponse extends ApiResponse<{
  avatar_url: string;
}> {}

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

export interface GetNotificationsResponse extends PaginatedResponse<Notification> {}

export interface MarkNotificationReadResponse extends ApiResponse<{
  marked: boolean;
}> {}

export interface MarkAllNotificationsReadResponse extends ApiResponse<{
  count: number;
}> {}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { error: ApiError } {
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
