import type { User } from './models';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  error: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// Auth Endpoints
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface WalletLoginRequest {
  wallet_address: string;
  signature: string;
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  token: string;
  refresh_token: string;
}

// ============================================
// Conversation Endpoints
// ============================================

export interface CreateConversationRequest {
  participant_ids: string[];
  name?: string;
}

export interface SendMessageRequest {
  content: string;
  message_type?: string;
  reply_to_id?: string;
  encrypted_content?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMessageRequest {
  content: string;
}

// ============================================
// Group Endpoints
// ============================================

export interface CreateGroupRequest {
  name: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  is_public?: boolean;
}

export interface CreateChannelRequest {
  name: string;
  type: string;
  category_id?: string;
  topic?: string;
  is_nsfw?: boolean;
  slow_mode_seconds?: number;
}

export interface UpdateChannelRequest {
  name?: string;
  topic?: string;
  position?: number;
  is_nsfw?: boolean;
  slow_mode_seconds?: number;
}

export interface CreateRoleRequest {
  name: string;
  color?: string;
  permissions?: number;
  is_mentionable?: boolean;
}

export interface CreateInviteRequest {
  max_uses?: number;
  expires_in_hours?: number;
}

// ============================================
// Forum Endpoints
// ============================================

export interface CreateForumRequest {
  name: string;
  description?: string;
  is_nsfw?: boolean;
  is_private?: boolean;
}

export interface CreatePostRequest {
  forum_id: string;
  title: string;
  content: string;
  post_type: string;
  link_url?: string;
  media_urls?: string[];
  category_id?: string;
  is_nsfw?: boolean;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  category_id?: string;
  is_nsfw?: boolean;
}

export interface CreateCommentRequest {
  content: string;
  parent_id?: string;
}

export interface VoteRequest {
  value: 1 | -1;
}

// ============================================
// User Endpoints
// ============================================

export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
}

export interface UpdateStatusRequest {
  status: string;
  status_message?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface Enable2FARequest {
  password: string;
}

export interface Verify2FARequest {
  code: string;
  secret: string;
}

// ============================================
// Notification Endpoints
// ============================================

export interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_name?: string;
}

// ============================================
// Friend Endpoints
// ============================================

export interface SendFriendRequestRequest {
  user_id: string;
}

export interface FriendsListResponse {
  data: import('./models').Friend[];
  meta?: PaginationMeta;
}

export interface FriendRequestsResponse {
  data: import('./models').FriendRequest[];
  meta?: PaginationMeta;
}

export interface FriendSuggestionsResponse {
  data: import('./models').FriendSuggestion[];
}

// ============================================
// Forum Hosting Endpoints
// ============================================

export interface CreateHostedForumRequest {
  name: string;
  slug?: string;
  description?: string;
  category: import('./models').ForumHostingCategory;
  primary_color?: string;
  accent_color?: string;
  is_private?: boolean;
  is_nsfw?: boolean;
  require_approval?: boolean;
}

export interface UpdateHostedForumRequest {
  name?: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  primary_color?: string;
  accent_color?: string;
  custom_css?: string;
  custom_header?: string;
  custom_footer?: string;
  is_private?: boolean;
  is_nsfw?: boolean;
  require_approval?: boolean;
}

export interface CreateBoardRequest {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string;
  position?: number;
  is_locked?: boolean;
}

export interface CreateThreadRequest {
  title: string;
  content: string;
  is_pinned?: boolean;
  is_announcement?: boolean;
}

export interface CreateThreadPostRequest {
  content: string;
}

export interface ForumLeaderboardResponse {
  data: import('./models').HostedForum[];
  meta?: {
    algorithm: 'hot' | 'rising' | 'trending' | 'top' | 'new';
    period?: 'day' | 'week' | 'month' | 'year' | 'all';
  };
}
