/**
 * Search Module Types
 *
 * Type definitions for search functionality across the application.
 *
 * @module modules/search/types
 * @version 1.0.0
 */

/**
 * Search content type
 */
export type SearchContentType =
  | 'users'
  | 'groups'
  | 'forums'
  | 'threads'
  | 'posts'
  | 'messages'
  | 'files'
  | 'all';

/**
 * Search sort options
 */
export type SearchSortBy = 'relevance' | 'date' | 'popularity' | 'alphabetical';

/**
 * Search sort order
 */
export type SearchSortOrder = 'asc' | 'desc';

/**
 * Date range filter
 */
export type DateRangeFilter = 'any' | 'today' | 'week' | 'month' | 'year' | 'custom';

/**
 * Search filters
 */
export interface SearchFilters {
  contentType: SearchContentType;
  sortBy: SearchSortBy;
  sortOrder: SearchSortOrder;
  dateRange: DateRangeFilter;
  customDateStart?: string;
  customDateEnd?: string;
  authorId?: string;
  groupId?: string;
  forumId?: string;
  hasAttachments?: boolean;
  minLikes?: number;
  minReplies?: number;
  tags?: string[];
}

/**
 * Search query
 */
export interface SearchQuery {
  query: string;
  filters: SearchFilters;
  page: number;
  limit: number;
}

/**
 * Base search result
 */
export interface BaseSearchResult {
  id: string;
  type: SearchContentType;
  title: string;
  excerpt: string;
  highlightedExcerpt?: string;
  url: string;
  createdAt: string;
  score: number;
}

/**
 * User search result
 */
export interface UserSearchResult extends BaseSearchResult {
  type: 'users';
  avatar?: string;
  username: string;
  displayName: string;
  isOnline: boolean;
  level: number;
  badges: number;
}

/**
 * Group search result
 */
export interface GroupSearchResult extends BaseSearchResult {
  type: 'groups';
  icon?: string;
  memberCount: number;
  isPublic: boolean;
  category?: string;
}

/**
 * Forum search result
 */
export interface ForumSearchResult extends BaseSearchResult {
  type: 'forums';
  threadCount: number;
  postCount: number;
  category?: string;
}

/**
 * Thread search result
 */
export interface ThreadSearchResult extends BaseSearchResult {
  type: 'threads';
  forumId: string;
  forumName: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  replyCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
}

/**
 * Post search result
 */
export interface PostSearchResult extends BaseSearchResult {
  type: 'posts';
  threadId: string;
  threadTitle: string;
  forumId: string;
  forumName: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  likes: number;
}

/**
 * Message search result
 */
export interface MessageSearchResult extends BaseSearchResult {
  type: 'messages';
  conversationId: string;
  conversationType: 'dm' | 'group';
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
}

/**
 * File search result
 */
export interface FileSearchResult extends BaseSearchResult {
  type: 'files';
  filename: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: {
    id: string;
    username: string;
  };
  contextType: 'message' | 'post' | 'group';
  contextId: string;
}

/**
 * Union type for all search results
 */
export type SearchResult =
  | UserSearchResult
  | GroupSearchResult
  | ForumSearchResult
  | ThreadSearchResult
  | PostSearchResult
  | MessageSearchResult
  | FileSearchResult;

/**
 * Search response
 */
export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  queryTime: number;
  facets?: SearchFacets;
}

/**
 * Search facet item
 */
export interface SearchFacetItem {
  value: string;
  count: number;
  label?: string;
}

/**
 * Search facets for filtering
 */
export interface SearchFacets {
  contentTypes: SearchFacetItem[];
  authors?: SearchFacetItem[];
  groups?: SearchFacetItem[];
  forums?: SearchFacetItem[];
  tags?: SearchFacetItem[];
  dateRanges?: SearchFacetItem[];
}

/**
 * Search suggestion
 */
export interface SearchSuggestion {
  type: 'query' | 'user' | 'group' | 'forum' | 'tag';
  value: string;
  display: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Recent search
 */
export interface RecentSearch {
  id: string;
  query: string;
  filters?: Partial<SearchFilters>;
  timestamp: string;
  resultCount: number;
}

/**
 * Saved search
 */
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  notifications: boolean;
  createdAt: string;
  lastRanAt?: string;
}

/**
 * Search analytics
 */
export interface SearchAnalytics {
  totalSearches: number;
  averageQueryTime: number;
  topQueries: Array<{ query: string; count: number }>;
  noResultsQueries: Array<{ query: string; count: number }>;
  contentTypeBreakdown: Record<SearchContentType, number>;
}
