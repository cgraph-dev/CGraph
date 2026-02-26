/**
 * Search Service
 *
 * Backend API integration for search features:
 * - Global search
 * - User search
 * - Group search
 * - Message search
 * - Forum search
 *
 * @module services/searchService
 * @since v0.9.0
 */

import api from '../lib/api';

// ==================== TYPES ====================

export interface SearchResult {
  type: 'user' | 'group' | 'channel' | 'message' | 'forum' | 'post';
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  url: string;
  matchContext: string | null;
  timestamp: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

export interface GlobalSearchResponse {
  query: string;
  results: SearchResult[];
  totals: {
    users: number;
    groups: number;
    channels: number;
    messages: number;
    forums: number;
    posts: number;
    total: number;
  };
  hasMore: boolean;
  searchId: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  isVerified: boolean;
  isPremium: boolean;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  mutualFriendsCount: number;
  isFriend: boolean;
}

export interface GroupSearchResult {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  memberCount: number;
  isPublic: boolean;
  category: string;
  isMember: boolean;
  tags: string[];
}

export interface MessageSearchResult {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  channelId: string;
  channelName: string;
  groupId: string | null;
  groupName: string | null;
  createdAt: string;
  highlightedContent: string;
}

export interface ForumSearchResult {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  memberCount: number;
  postCount: number;
  category: string;
  isMember: boolean;
}

export interface PostSearchResult {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  forumId: string;
  forumName: string;
  createdAt: string;
  replyCount: number;
  likeCount: number;
  highlightedContent: string;
}

export interface SearchSuggestion {
  type: 'recent' | 'trending' | 'recommended';
  query: string;
  icon: string;
  count?: number;
}

export interface SearchFilters {
  type?: 'user' | 'group' | 'channel' | 'message' | 'forum' | 'post';
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  sortBy?: 'relevance' | 'date' | 'popularity';
  groupId?: string;
  forumId?: string;
  channelId?: string;
  fromUserId?: string;
  minLevel?: number;
  verified?: boolean;
}

// ==================== GLOBAL SEARCH API ====================

/**
 * Perform global search across all content types
 */
export async function globalSearch(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    filters?: SearchFilters;
  }
): Promise<GlobalSearchResponse> {
  const params = {
    q: query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    ...flattenFilters(options?.filters),
  };
  const response = await api.get('/api/v1/search', { params });
  return transformGlobalSearchResponse(response.data.data || response.data, query);
}

/**
 * Get search suggestions based on query
 */
export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const params = { q: query };
  const response = await api.get('/api/v1/search/suggestions', { params });
  return (response.data.data || response.data.suggestions || []).map(transformSearchSuggestion);
}

/**
 * Get recent searches
 */
export async function getRecentSearches(): Promise<SearchSuggestion[]> {
  const response = await api.get('/api/v1/search/recent');
  return (response.data.data || response.data.searches || []).map((s: ApiData) => ({
    type: 'recent' as const,
    query: s.query || s,
    icon: 'time-outline',
  }));
}

/**
 * Get trending searches
 */
export async function getTrendingSearches(): Promise<SearchSuggestion[]> {
  const response = await api.get('/api/v1/search/trending');
  return (response.data.data || response.data.searches || []).map(transformSearchSuggestion);
}

/**
 * Clear recent searches
 */
export async function clearRecentSearches(): Promise<void> {
  await api.delete('/api/v1/search/recent');
}

/**
 * Save search to history
 */
export async function saveSearchToHistory(query: string): Promise<void> {
  await api.post('/api/v1/search/recent', { query });
}

// ==================== USER SEARCH API ====================

/**
 * Search users
 */
export async function searchUsers(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    minLevel?: number;
    verified?: boolean;
    online?: boolean;
  }
): Promise<UserSearchResult[]> {
  const params = {
    q: query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    min_level: options?.minLevel,
    verified: options?.verified,
    online: options?.online,
  };
  const response = await api.get('/api/v1/search/users', { params });
  return (response.data.data || response.data.users || []).map(transformUserSearchResult);
}

// ==================== GROUP SEARCH API ====================

/**
 * Search groups
 */
export async function searchGroups(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    category?: string;
    publicOnly?: boolean;
    sortBy?: 'relevance' | 'members' | 'activity' | 'created';
  }
): Promise<GroupSearchResult[]> {
  const params = {
    q: query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    category: options?.category,
    public_only: options?.publicOnly,
    sort_by: options?.sortBy,
  };
  const response = await api.get('/api/v1/search/groups', { params });
  return (response.data.data || response.data.groups || []).map(transformGroupSearchResult);
}

// ==================== MESSAGE SEARCH API ====================

/**
 * Search messages
 */
export async function searchMessages(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    channelId?: string;
    groupId?: string;
    fromUserId?: string;
    timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  }
): Promise<MessageSearchResult[]> {
  const params = {
    q: query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    channel_id: options?.channelId,
    group_id: options?.groupId,
    from_user_id: options?.fromUserId,
    time_range: options?.timeRange,
  };
  const response = await api.get('/api/v1/search/messages', { params });
  return (response.data.data || response.data.messages || []).map(transformMessageSearchResult);
}

// ==================== FORUM SEARCH API ====================

/**
 * Search forums
 */
export async function searchForums(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    category?: string;
  }
): Promise<ForumSearchResult[]> {
  const params = {
    q: query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    category: options?.category,
  };
  const response = await api.get('/api/v1/search/forums', { params });
  return (response.data.data || response.data.forums || []).map(transformForumSearchResult);
}

/**
 * Search forum posts
 */
export async function searchPosts(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
    forumId?: string;
    authorId?: string;
    timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    sortBy?: 'relevance' | 'date' | 'likes' | 'replies';
  }
): Promise<PostSearchResult[]> {
  const params = {
    q: query,
    limit: options?.limit || 20,
    offset: options?.offset || 0,
    forum_id: options?.forumId,
    author_id: options?.authorId,
    time_range: options?.timeRange,
    sort_by: options?.sortBy,
  };
  const response = await api.get('/api/v1/search/posts', { params });
  return (response.data.data || response.data.posts || []).map(transformPostSearchResult);
}

// ==================== HELPERS ====================

function flattenFilters(filters?: SearchFilters): Record<string, unknown> {
  if (!filters) return {};
  return {
    type: filters.type,
    time_range: filters.timeRange,
    sort_by: filters.sortBy,
    group_id: filters.groupId,
    forum_id: filters.forumId,
    channel_id: filters.channelId,
    from_user_id: filters.fromUserId,
    min_level: filters.minLevel,
    verified: filters.verified,
  };
}

// ==================== TRANSFORMERS ====================

/** API response type for transform functions */
/** API response data 2014 typed as any at the boundary, return types enforce safety */
type ApiData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function transformSearchResult(data: ApiData): SearchResult {
  return {
    type: data.type,
    id: data.id,
    title: data.title || data.name || data.username,
    subtitle: data.subtitle || data.description || null,
    imageUrl: data.image_url || data.imageUrl || data.avatar_url || data.avatarUrl || null,
    url: data.url || '',
    matchContext: data.match_context || data.matchContext || data.highlighted || null,
    timestamp: data.timestamp || data.created_at || data.createdAt || null,
    metadata: data.metadata || {},
  };
}

function transformGlobalSearchResponse(data: ApiData, query: string): GlobalSearchResponse {
  return {
    query,
    results: (data.results || []).map(transformSearchResult),
    totals: {
      users: data.totals?.users ?? 0,
      groups: data.totals?.groups ?? 0,
      channels: data.totals?.channels ?? 0,
      messages: data.totals?.messages ?? 0,
      forums: data.totals?.forums ?? 0,
      posts: data.totals?.posts ?? 0,
      total: data.totals?.total ?? data.total ?? 0,
    },
    hasMore: data.has_more ?? data.hasMore ?? false,
    searchId: data.search_id || data.searchId || '',
  };
}

function transformSearchSuggestion(data: ApiData): SearchSuggestion {
  return {
    type: data.type || 'trending',
    query: data.query || data,
    icon: data.icon || 'trending-up-outline',
    count: data.count,
  };
}

function transformUserSearchResult(data: ApiData): UserSearchResult {
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name || data.displayName || null,
    avatarUrl: data.avatar_url || data.avatarUrl || null,
    bio: data.bio || null,
    level: data.level || 1,
    isVerified: data.is_verified ?? data.isVerified ?? false,
    isPremium: data.is_premium ?? data.isPremium ?? false,
    status: data.status || 'offline',
    mutualFriendsCount: data.mutual_friends_count ?? data.mutualFriendsCount ?? 0,
    isFriend: data.is_friend ?? data.isFriend ?? false,
  };
}

function transformGroupSearchResult(data: ApiData): GroupSearchResult {
  return {
    id: data.id,
    name: data.name,
    description: data.description || null,
    avatarUrl: data.avatar_url || data.avatarUrl || null,
    memberCount: data.member_count ?? data.memberCount ?? 0,
    isPublic: data.is_public ?? data.isPublic ?? true,
    category: data.category || 'general',
    isMember: data.is_member ?? data.isMember ?? false,
    tags: data.tags || [],
  };
}

function transformMessageSearchResult(data: ApiData): MessageSearchResult {
  return {
    id: data.id,
    content: data.content,
    senderId: data.sender_id || data.senderId,
    senderName: data.sender_name || data.senderName || data.sender?.username,
    senderAvatar: data.sender_avatar || data.senderAvatar || data.sender?.avatar_url || null,
    channelId: data.channel_id || data.channelId,
    channelName: data.channel_name || data.channelName,
    groupId: data.group_id || data.groupId || null,
    groupName: data.group_name || data.groupName || null,
    createdAt: data.created_at || data.createdAt,
    highlightedContent: data.highlighted_content || data.highlightedContent || data.content,
  };
}

function transformForumSearchResult(data: ApiData): ForumSearchResult {
  return {
    id: data.id,
    name: data.name,
    description: data.description || null,
    iconUrl: data.icon_url || data.iconUrl || null,
    memberCount: data.member_count ?? data.memberCount ?? 0,
    postCount: data.post_count ?? data.postCount ?? 0,
    category: data.category || 'general',
    isMember: data.is_member ?? data.isMember ?? false,
  };
}

function transformPostSearchResult(data: ApiData): PostSearchResult {
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    authorId: data.author_id || data.authorId,
    authorName: data.author_name || data.authorName || data.author?.username,
    authorAvatar: data.author_avatar || data.authorAvatar || data.author?.avatar_url || null,
    forumId: data.forum_id || data.forumId,
    forumName: data.forum_name || data.forumName,
    createdAt: data.created_at || data.createdAt,
    replyCount: data.reply_count ?? data.replyCount ?? 0,
    likeCount: data.like_count ?? data.likeCount ?? 0,
    highlightedContent: data.highlighted_content || data.highlightedContent || data.content,
  };
}
