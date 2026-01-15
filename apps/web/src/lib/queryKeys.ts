/**
 * Query Key Factories for TanStack Query
 *
 * Provides type-safe, centralized query key management for React Query.
 *
 * ## Usage
 *
 * ```tsx
 * import { queryKeys } from '@/lib/queryKeys';
 *
 * // In queries
 * useQuery({
 *   queryKey: queryKeys.users.detail(userId),
 *   queryFn: () => fetchUser(userId),
 * });
 *
 * // In invalidations
 * queryClient.invalidateQueries({
 *   queryKey: queryKeys.users.all,
 * });
 * ```
 *
 * ## Structure
 *
 * Query keys follow a hierarchical pattern:
 * - `[entity]` - All queries for an entity
 * - `[entity, 'list']` - List queries
 * - `[entity, 'list', filters]` - Filtered list queries
 * - `[entity, 'detail', id]` - Detail queries
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

// Type definitions for query key structure (for documentation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _QueryKeyFactory<T extends Record<string, unknown>> = {
  all: readonly [string];
  lists: () => readonly [string, string];
  list: (filters?: T) => readonly [string, string, T | undefined];
  details: () => readonly [string, string];
  detail: (id: string) => readonly [string, string, string];
};

// Filters types
export interface UserFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'pending';
  page?: number;
  limit?: number;
}

export interface ConversationFilters {
  search?: string;
  unread?: boolean;
  archived?: boolean;
  page?: number;
  limit?: number;
}

export interface MessageFilters {
  conversationId: string;
  before?: string;
  after?: string;
  limit?: number;
}

export interface GroupFilters {
  search?: string;
  category?: string;
  joined?: boolean;
  page?: number;
  limit?: number;
}

export interface ForumFilters {
  search?: string;
  categoryId?: string;
  sort?: 'recent' | 'popular' | 'trending';
  page?: number;
  limit?: number;
}

export interface NotificationFilters {
  read?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

// Query key factories
export const queryKeys = {
  // -------------------------------------------------------------------------
  // Auth & User
  // -------------------------------------------------------------------------
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    tokens: () => [...queryKeys.auth.all, 'tokens'] as const,
  },

  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (userId: string) => [...queryKeys.users.details(), userId] as const,
    profile: (userId: string) => [...queryKeys.users.all, 'profile', userId] as const,
    settings: () => [...queryKeys.users.all, 'settings'] as const,
    preferences: () => [...queryKeys.users.all, 'preferences'] as const,
    presence: (userId: string) => [...queryKeys.users.all, 'presence', userId] as const,
    search: (query: string) => [...queryKeys.users.all, 'search', query] as const,
  },

  // -------------------------------------------------------------------------
  // Conversations & Messages
  // -------------------------------------------------------------------------
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters?: ConversationFilters) => [...queryKeys.conversations.lists(), filters] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (conversationId: string) =>
      [...queryKeys.conversations.details(), conversationId] as const,
    unread: () => [...queryKeys.conversations.all, 'unread'] as const,
    participants: (conversationId: string) =>
      [...queryKeys.conversations.all, 'participants', conversationId] as const,
  },

  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (filters: MessageFilters) => [...queryKeys.messages.lists(), filters] as const,
    details: () => [...queryKeys.messages.all, 'detail'] as const,
    detail: (messageId: string) => [...queryKeys.messages.details(), messageId] as const,
    reactions: (messageId: string) => [...queryKeys.messages.all, 'reactions', messageId] as const,
    search: (conversationId: string, query: string) =>
      [...queryKeys.messages.all, 'search', conversationId, query] as const,
  },

  // -------------------------------------------------------------------------
  // Groups
  // -------------------------------------------------------------------------
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (filters?: GroupFilters) => [...queryKeys.groups.lists(), filters] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (groupId: string) => [...queryKeys.groups.details(), groupId] as const,
    members: (groupId: string) => [...queryKeys.groups.all, 'members', groupId] as const,
    channels: (groupId: string) => [...queryKeys.groups.all, 'channels', groupId] as const,
    roles: (groupId: string) => [...queryKeys.groups.all, 'roles', groupId] as const,
    invites: (groupId: string) => [...queryKeys.groups.all, 'invites', groupId] as const,
    settings: (groupId: string) => [...queryKeys.groups.all, 'settings', groupId] as const,
  },

  // -------------------------------------------------------------------------
  // Forum
  // -------------------------------------------------------------------------
  forum: {
    all: ['forum'] as const,
    categories: () => [...queryKeys.forum.all, 'categories'] as const,
    category: (categoryId: string) => [...queryKeys.forum.all, 'category', categoryId] as const,
    threads: {
      all: ['forum', 'threads'] as const,
      lists: () => [...queryKeys.forum.threads.all, 'list'] as const,
      list: (filters?: ForumFilters) => [...queryKeys.forum.threads.lists(), filters] as const,
      detail: (threadId: string) => [...queryKeys.forum.threads.all, 'detail', threadId] as const,
    },
    posts: {
      all: ['forum', 'posts'] as const,
      list: (threadId: string, page?: number) =>
        [...queryKeys.forum.posts.all, 'list', threadId, page] as const,
      detail: (postId: string) => [...queryKeys.forum.posts.all, 'detail', postId] as const,
    },
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: NotificationFilters) => [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
    detail: (notificationId: string) =>
      [...queryKeys.notifications.all, 'detail', notificationId] as const,
  },

  // -------------------------------------------------------------------------
  // Media & Files
  // -------------------------------------------------------------------------
  media: {
    all: ['media'] as const,
    uploads: () => [...queryKeys.media.all, 'uploads'] as const,
    upload: (uploadId: string) => [...queryKeys.media.all, 'upload', uploadId] as const,
    gallery: (entityType: string, entityId: string) =>
      [...queryKeys.media.all, 'gallery', entityType, entityId] as const,
  },

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------
  search: {
    all: ['search'] as const,
    global: (query: string) => [...queryKeys.search.all, 'global', query] as const,
    users: (query: string) => [...queryKeys.search.all, 'users', query] as const,
    messages: (query: string) => [...queryKeys.search.all, 'messages', query] as const,
    groups: (query: string) => [...queryKeys.search.all, 'groups', query] as const,
    threads: (query: string) => [...queryKeys.search.all, 'threads', query] as const,
  },

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------
  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    users: (filters?: UserFilters) => [...queryKeys.admin.all, 'users', filters] as const,
    reports: () => [...queryKeys.admin.all, 'reports'] as const,
    logs: (page?: number) => [...queryKeys.admin.all, 'logs', page] as const,
  },
} as const;

// Type helper for extracting query key types
export type QueryKeys = typeof queryKeys;

// Helper to invalidate all queries for an entity
export const invalidateEntity = (
  queryClient: { invalidateQueries: (options: { queryKey: readonly unknown[] }) => Promise<void> },
  entityKey: readonly [string, ...unknown[]]
) => {
  return queryClient.invalidateQueries({ queryKey: entityKey });
};

// Helper for prefetching
export const prefetchQuery = async <T>(
  queryClient: {
    prefetchQuery: (options: {
      queryKey: readonly unknown[];
      queryFn: () => Promise<T>;
      staleTime?: number;
    }) => Promise<void>;
  },
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime = 1000 * 60 * 5 // 5 minutes default
) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
};

export default queryKeys;
