/**
 * Forum Store — Implementation
 *
 * Zustand store with all forum CRUD, voting, moderation,
 * and MyBB-style feature actions (prefixes, polls, ratings,
 * groups, warnings, bans, reports, moderation queue).
 *
 * @module modules/forums/store/forumStore.impl
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('ForumStore');

import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, ensureObject } from '@/lib/apiUtils';
import type {
  Forum,
  Post,
  Comment,
  ThreadPrefix,
  ThreadRating,
  PostAttachment,
  PostEditHistory,
  Poll,
  Subscription,
  UserGroup,
  UserWarning,
  Ban,
  ModerationQueueItem,
  Report,
  ForumState,
  CreatePostData,
  CreateForumData,
} from './forumStore.types';

// Re-export all types for backward compatibility
export type {
  Forum,
  ForumCategory,
  ForumModerator,
  Post,
  Comment,
  ThreadPrefix,
  ThreadRating,
  PostAttachment,
  PostEditHistory,
  Poll,
  PollOption,
  Subscription,
  UserGroup,
  GroupPermissions,
  UserWarning,
  WarningType,
  Ban,
  ModerationQueueItem,
  Report,
  SortOption,
  LeaderboardSort,
  TimeRange,
  LeaderboardMeta,
  CreatePostData,
  CreateForumData,
  UpdateForumData,
  CreateThreadPrefixData,
  CreatePollData,
  CreateUserGroupData,
  UpdateUserGroupData,
  CreateBanData,
  CreateReportData,
  ForumState,
} from './forumStore.types';

// ── API Response Mapper ────────────────────────────────────────────────

function mapForumFromApi(data: Record<string, unknown>): Forum {
  const owner = data.owner as Record<string, unknown> | null;
  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    description: (data.description as string | null) || null,
    iconUrl: (data.icon as string | null) || null,
    bannerUrl: (data.banner as string | null) || null,
    customCss: null,
    isNsfw: (data.is_nsfw as boolean) || false,
    isPrivate: (data.is_private as boolean) || false,
    isPublic: !(data.is_private as boolean),
    memberCount: (data.member_count as number) || 0,
    score: (data.score as number) || 0,
    upvotes: (data.upvotes as number) || 0,
    downvotes: (data.downvotes as number) || 0,
    hotScore: (data.hot_score as number) || 0,
    weeklyScore: (data.weekly_score as number) || 0,
    featured: (data.featured as boolean) || false,
    userVote: ((data.user_vote as number) || 0) as 1 | -1 | 0,
    categories: ensureArray(data.categories, 'categories'),
    moderators: [],
    isSubscribed: (data.is_subscribed as boolean) || false,
    isMember: (data.is_member as boolean) || false,
    ownerId: (owner?.id as string | null) || null,
    createdAt: data.created_at as string,
  };
}

// ── Store Creation ─────────────────────────────────────────────────────

export const useForumStore = create<ForumState>((set, get) => ({
  // Initial state
  forums: [],
  posts: [],
  currentPost: null,
  currentForum: null,
  comments: {},
  subscribedForums: [],
  leaderboard: [],
  leaderboardMeta: null,
  topForums: [],
  isLoadingForums: false,
  isLoadingPosts: false,
  isLoadingComments: false,
  isLoadingLeaderboard: false,
  hasMorePosts: true,
  sortBy: 'hot',
  timeRange: 'day',
  threadPrefixes: [],
  subscriptions: [],
  userGroups: [],
  moderationQueue: [],
  reports: [],
  multiQuoteBuffer: [],

  // ── Core CRUD ──────────────────────────────────────────────────────

  fetchForums: async () => {
    set({ isLoadingForums: true });
    try {
      const response = await api.get('/api/v1/forums');
      const rawForums = ensureArray<Record<string, unknown>>(response.data, 'forums');
      const forums = rawForums.map(mapForumFromApi);
      set({ forums, isLoadingForums: false });
    } catch (error: unknown) {
      set({ isLoadingForums: false });
      throw error;
    }
  },

  fetchForum: async (slug: string) => {
    const response = await api.get(`/api/v1/forums/${slug}`);
    const rawData = ensureObject<Record<string, unknown>>(response.data, 'forum');
    if (rawData) {
      const forum = mapForumFromApi(rawData);
      set((state) => ({
        currentForum: forum,
        forums: state.forums.some((f) => f.id === forum.id)
          ? state.forums.map((f) => (f.id === forum.id ? forum : f))
          : [...state.forums, forum],
      }));
      return forum;
    }
    throw new Error('Forum not found');
  },

  fetchPosts: async (forumSlug?: string, page: number = 1) => {
    set({ isLoadingPosts: true });
    try {
      const { sortBy, timeRange } = get();
      const params: Record<string, string | number> = { sort: sortBy, page, limit: 25 };
      if (sortBy === 'top') params.time = timeRange;

      const endpoint = forumSlug ? `/api/v1/forums/${forumSlug}/posts` : '/api/v1/posts/feed';
      const response = await api.get(endpoint, { params });
      const newPosts = ensureArray<Post>(response.data, 'posts');

      set((state) => ({
        posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
        hasMorePosts: newPosts.length === 25,
        isLoadingPosts: false,
      }));
    } catch (error: unknown) {
      set({ isLoadingPosts: false });
      throw error;
    }
  },

  fetchPost: async (postId: string) => {
    const response = await api.get(`/api/v1/posts/${postId}`);
    const post = ensureObject<Post>(response.data, 'post');
    set({ currentPost: post });
  },

  fetchComments: async (postId: string) => {
    set({ isLoadingComments: true });
    try {
      const response = await api.get(`/api/v1/posts/${postId}/comments`);
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: ensureArray<Comment>(response.data, 'comments'),
        },
        isLoadingComments: false,
      }));
    } catch (error: unknown) {
      set({ isLoadingComments: false });
      throw error;
    }
  },

  createPost: async (data: CreatePostData) => {
    const payload: Record<string, unknown> = {
      forum_id: data.forumId,
      title: data.title,
      content: data.content,
      post_type: data.postType,
      link_url: data.linkUrl,
      media_urls: data.mediaUrls,
      category_id: data.categoryId,
      is_nsfw: data.isNsfw,
    };

    if (data.prefixId) payload.prefix_id = data.prefixId;
    if (data.attachmentIds?.length) payload.attachment_ids = data.attachmentIds;

    if (data.postType === 'poll' && data.poll) {
      payload.poll = {
        question: data.poll.question,
        options: data.poll.options.filter((opt) => opt.trim() !== ''),
        allow_multiple: data.poll.allowMultiple || false,
        is_public: data.poll.isPublic || false,
        expires_at: data.poll.expiresAt,
      };
    }

    const response = await api.post('/api/v1/posts', payload);
    const post = ensureObject<Post>(response.data, 'post');
    if (post) {
      set((state) => ({ posts: [post, ...state.posts] }));
      return post;
    }
    throw new Error('Failed to create post');
  },

  createComment: async (postId: string, content: string, parentId?: string) => {
    const response = await api.post(`/api/v1/posts/${postId}/comments`, {
      content,
      parent_id: parentId,
    });
    const comment = ensureObject<Comment>(response.data, 'comment');
    if (comment) {
      set((state) => {
        const postComments = state.comments[postId] || [];
        if (parentId) {
          return { comments: { ...state.comments, [postId]: postComments } };
        }
        return { comments: { ...state.comments, [postId]: [comment, ...postComments] } };
      });
      return comment;
    }
    throw new Error('Failed to create comment');
  },

  // ── Voting ─────────────────────────────────────────────────────────

  vote: async (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => {
    const endpoint = type === 'post' ? `/api/v1/posts/${id}/vote` : `/api/v1/comments/${id}/vote`;
    const previousPosts = get().posts;
    const previousCurrentPost = get().currentPost;

    if (type === 'post') {
      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id !== id) return p;
          const oldVote = p.myVote;
          let upvotes = p.upvotes;
          let downvotes = p.downvotes;
          if (oldVote === 1) upvotes--;
          if (oldVote === -1) downvotes--;
          if (value === 1) upvotes++;
          if (value === -1) downvotes++;
          return { ...p, myVote: value, upvotes, downvotes, score: upvotes - downvotes };
        }),
        currentPost:
          state.currentPost?.id === id
            ? { ...state.currentPost, myVote: value }
            : state.currentPost,
      }));
    }

    try {
      if (value === null) {
        await api.delete(endpoint);
      } else {
        await api.post(endpoint, { value });
      }
    } catch (error: unknown) {
      if (type === 'post') {
        set({ posts: previousPosts, currentPost: previousCurrentPost });
      }
      throw error;
    }
  },

  voteForum: async (forumId: string, value: 1 | -1) => {
    const response = await api.post(`/api/v1/forums/${forumId}/vote`, { value });
    const result = response.data;

    const updateForum = (forum: Forum) => {
      if (forum.id !== forumId) return forum;
      return {
        ...forum,
        score: result.forum.score,
        upvotes: result.forum.upvotes,
        downvotes: result.forum.downvotes,
        userVote: result.forum.user_vote,
      };
    };

    set((state) => ({
      forums: state.forums.map(updateForum),
      leaderboard: state.leaderboard.map(updateForum),
      topForums: state.topForums.map(updateForum),
    }));
  },

  // ── Subscriptions & Leaderboard ────────────────────────────────────

  subscribe: async (forumId: string) => {
    await api.post(`/api/v1/forums/${forumId}/subscribe`);
    set((state) => ({
      forums: state.forums.map((f) =>
        f.id === forumId ? { ...f, isSubscribed: true, memberCount: f.memberCount + 1 } : f
      ),
    }));
  },

  unsubscribe: async (forumId: string) => {
    await api.delete(`/api/v1/forums/${forumId}/subscribe`);
    set((state) => ({
      forums: state.forums.map((f) =>
        f.id === forumId ? { ...f, isSubscribed: false, memberCount: f.memberCount - 1 } : f
      ),
    }));
  },

  fetchLeaderboard: async (sort = 'hot', page = 1) => {
    set({ isLoadingLeaderboard: true });
    try {
      const response = await api.get('/api/v1/forums/leaderboard', {
        params: { sort, page, per_page: 25 },
      });
      const rawForums = ensureArray<Record<string, unknown>>(response.data, 'data');
      const forums = rawForums.map(mapForumFromApi);
      const meta = response.data.meta;

      set({
        leaderboard: page === 1 ? forums : [...get().leaderboard, ...forums],
        leaderboardMeta: {
          page: meta.page,
          perPage: meta.per_page,
          total: meta.total,
          sort: meta.sort,
        },
        isLoadingLeaderboard: false,
      });
    } catch (error: unknown) {
      set({ isLoadingLeaderboard: false });
      throw error;
    }
  },

  fetchTopForums: async (limit = 10, sort = 'hot') => {
    const response = await api.get('/api/v1/forums/top', { params: { limit, sort } });
    const rawForums = ensureArray<Record<string, unknown>>(response.data, 'data');
    set({ topForums: rawForums.map(mapForumFromApi) });
  },

  setSortBy: (sort) => set({ sortBy: sort, posts: [], hasMorePosts: true }),
  setTimeRange: (range) => set({ timeRange: range, posts: [], hasMorePosts: true }),

  // ── Forum CRUD ─────────────────────────────────────────────────────

  createForum: async (data: CreateForumData) => {
    try {
      const response = await api.post('/api/v1/forums', {
        name: data.name,
        description: data.description,
        is_nsfw: data.isNsfw,
        is_private: data.isPrivate,
      });
      const forum = ensureObject<Forum>(response.data, 'forum');
      if (forum) {
        set((state) => ({ forums: [forum, ...state.forums] }));
        return forum;
      }
      throw new Error('Failed to create forum - no forum returned');
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'createForum');
      throw error;
    }
  },

  updateForum: async (forumId, data) => {
    try {
      const response = await api.put(`/api/v1/forums/${forumId}`, {
        name: data.name,
        description: data.description,
        is_public: data.isPublic,
        is_nsfw: data.isNsfw,
        icon_url: data.iconUrl,
        banner_url: data.bannerUrl,
        custom_css: data.customCss,
      });
      const forum = ensureObject<Forum>(response.data, 'forum');
      if (forum) {
        const mapped = mapForumFromApi(forum as unknown as Record<string, unknown>);
        set((state) => ({ forums: state.forums.map((f) => (f.id === forumId ? mapped : f)) }));
        return mapped;
      }
      throw new Error('Failed to update forum');
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'updateForum');
      throw error;
    }
  },

  deleteForum: async (forumId) => {
    try {
      await api.delete(`/api/v1/forums/${forumId}`);
      set((state) => ({ forums: state.forums.filter((f) => f.id !== forumId) }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteForum');
      throw error;
    }
  },

  // ── Moderation ─────────────────────────────────────────────────────

  pinPost: async (forumId, postId) => {
    try {
      await api.post(`/api/v1/forums/${forumId}/posts/${postId}/pin`);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, isPinned: true } : p)),
        currentPost:
          state.currentPost?.id === postId
            ? { ...state.currentPost, isPinned: true }
            : state.currentPost,
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'pinPost');
      throw error;
    }
  },

  unpinPost: async (forumId, postId) => {
    try {
      await api.delete(`/api/v1/forums/${forumId}/posts/${postId}/pin`);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, isPinned: false } : p)),
        currentPost:
          state.currentPost?.id === postId
            ? { ...state.currentPost, isPinned: false }
            : state.currentPost,
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'unpinPost');
      throw error;
    }
  },

  lockPost: async (forumId, postId) => {
    try {
      await api.post(`/api/v1/forums/${forumId}/posts/${postId}/lock`);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, isLocked: true } : p)),
        currentPost:
          state.currentPost?.id === postId
            ? { ...state.currentPost, isLocked: true }
            : state.currentPost,
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'lockPost');
      throw error;
    }
  },

  unlockPost: async (forumId, postId) => {
    try {
      await api.delete(`/api/v1/forums/${forumId}/posts/${postId}/lock`);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === postId ? { ...p, isLocked: false } : p)),
        currentPost:
          state.currentPost?.id === postId
            ? { ...state.currentPost, isLocked: false }
            : state.currentPost,
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'unlockPost');
      throw error;
    }
  },

  deletePost: async (forumId, postId) => {
    try {
      await api.delete(`/api/v1/forums/${forumId}/posts/${postId}`);
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        currentPost: state.currentPost?.id === postId ? null : state.currentPost,
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'deletePost');
      throw error;
    }
  },

  // ── Thread Prefixes ────────────────────────────────────────────────

  fetchThreadPrefixes: async () => {
    const standardPrefixes: ThreadPrefix[] = [
      { id: 'discussion', name: 'Discussion', color: '#3B82F6', isDefault: true },
      { id: 'question', name: 'Question', color: '#8B5CF6', isDefault: false },
      { id: 'help', name: 'Help', color: '#EF4444', isDefault: false },
      { id: 'solved', name: 'Solved', color: '#10B981', isDefault: false },
      { id: 'announcement', name: 'Announcement', color: '#F59E0B', isDefault: false },
      { id: 'guide', name: 'Guide', color: '#06B6D4', isDefault: false },
      { id: 'news', name: 'News', color: '#EC4899', isDefault: false },
      { id: 'bug', name: 'Bug', color: '#DC2626', isDefault: false },
      { id: 'feature', name: 'Feature Request', color: '#7C3AED', isDefault: false },
    ];
    set({ threadPrefixes: standardPrefixes });
  },

  createThreadPrefix: async (data) => {
    try {
      const response = await api.post('/api/v1/admin/thread-prefixes', {
        name: data.name,
        color: data.color,
        forums: data.forums,
      });
      const prefix = response.data.prefix;
      set((state) => ({ threadPrefixes: [...state.threadPrefixes, prefix] }));
      return prefix;
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'createThreadPrefix');
      throw error;
    }
  },

  deleteThreadPrefix: async (prefixId) => {
    try {
      await api.delete(`/api/v1/admin/thread-prefixes/${prefixId}`);
      set((state) => ({ threadPrefixes: state.threadPrefixes.filter((p) => p.id !== prefixId) }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteThreadPrefix');
      throw error;
    }
  },

  // ── Thread Ratings ─────────────────────────────────────────────────

  rateThread: async (threadId, rating) => {
    try {
      const response = await api.post(`/api/v1/posts/${threadId}/rate`, { rating });
      const result = response.data;
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === threadId
            ? {
                ...p,
                rating: result.average_rating,
                ratingCount: result.rating_count,
                myRating: rating,
              }
            : p
        ),
        currentPost:
          state.currentPost?.id === threadId
            ? {
                ...state.currentPost,
                rating: result.average_rating,
                ratingCount: result.rating_count,
                myRating: rating,
              }
            : state.currentPost,
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'rateThread');
      throw error;
    }
  },

  fetchThreadRatings: async (threadId) => {
    try {
      const response = await api.get(`/api/v1/posts/${threadId}/ratings`);
      return ensureArray<ThreadRating>(response.data, 'ratings');
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchThreadRatings');
      return [];
    }
  },

  // ── Attachments ────────────────────────────────────────────────────

  uploadAttachment: async (file, postId?) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (postId) formData.append('post_id', postId);
      const response = await api.post('/api/v1/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.attachment as PostAttachment;
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'uploadAttachment');
      throw error;
    }
  },

  deleteAttachment: async (attachmentId) => {
    try {
      await api.delete(`/api/v1/attachments/${attachmentId}`);
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteAttachment');
      throw error;
    }
  },

  // ── Edit History ───────────────────────────────────────────────────

  fetchEditHistory: async (postId) => {
    try {
      const response = await api.get(`/api/v1/posts/${postId}/edit-history`);
      return ensureArray<PostEditHistory>(response.data, 'history');
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchEditHistory');
      return [];
    }
  },

  // ── Polls ──────────────────────────────────────────────────────────

  createPoll: async (threadId, data) => {
    try {
      const response = await api.post(`/api/v1/posts/${threadId}/poll`, {
        question: data.question,
        options: data.options,
        allow_multiple: data.allowMultiple,
        max_selections: data.maxSelections,
        timeout: data.timeout,
        public: data.public,
      });
      return response.data.poll as Poll;
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'createPoll');
      throw error;
    }
  },

  votePoll: async (pollId, optionIds) => {
    try {
      await api.post(`/api/v1/polls/${pollId}/vote`, { option_ids: optionIds });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'votePoll');
      throw error;
    }
  },

  closePoll: async (pollId) => {
    try {
      await api.post(`/api/v1/polls/${pollId}/close`);
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'closePoll');
      throw error;
    }
  },

  // ── Thread Subscriptions ───────────────────────────────────────────

  subscribeThread: async (threadId, notificationMode) => {
    try {
      await api.post(`/api/v1/posts/${threadId}/subscribe`, {
        notification_mode: notificationMode,
      });
      set((state) => ({
        subscriptions: [
          ...state.subscriptions,
          {
            id: `sub-${threadId}`,
            userId: '',
            entityType: 'thread' as const,
            entityId: threadId,
            notificationMode,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'subscribeThread');
      throw error;
    }
  },

  unsubscribeThread: async (threadId) => {
    try {
      await api.delete(`/api/v1/posts/${threadId}/subscribe`);
      set((state) => ({
        subscriptions: state.subscriptions.filter((s) => s.entityId !== threadId),
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'unsubscribeThread');
      throw error;
    }
  },

  updateSubscription: async (subscriptionId, notificationMode) => {
    try {
      await api.put(`/api/v1/subscriptions/${subscriptionId}`, {
        notification_mode: notificationMode,
      });
      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === subscriptionId ? { ...s, notificationMode } : s
        ),
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'updateSubscription');
      throw error;
    }
  },

  fetchSubscriptions: async () => {
    try {
      const response = await api.get('/api/v1/subscriptions');
      set({ subscriptions: ensureArray<Subscription>(response.data, 'subscriptions') });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchSubscriptions');
    }
  },

  // ── User Groups ────────────────────────────────────────────────────

  fetchUserGroups: async () => {
    try {
      const response = await api.get('/api/v1/user-groups');
      set({ userGroups: ensureArray<UserGroup>(response.data, 'user_groups') });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchUserGroups');
    }
  },

  createUserGroup: async (data) => {
    try {
      const response = await api.post('/api/v1/admin/user-groups', {
        name: data.name,
        description: data.description,
        color: data.color,
        type: data.type,
        permissions: data.permissions,
      });
      const group = response.data.user_group as UserGroup;
      set((state) => ({ userGroups: [...state.userGroups, group] }));
      return group;
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'createUserGroup');
      throw error;
    }
  },

  updateUserGroup: async (groupId, data) => {
    try {
      const response = await api.put(`/api/v1/admin/user-groups/${groupId}`, {
        name: data.name,
        description: data.description,
        color: data.color,
        permissions: data.permissions,
      });
      const group = response.data.user_group as UserGroup;
      set((state) => ({ userGroups: state.userGroups.map((g) => (g.id === groupId ? group : g)) }));
      return group;
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'updateUserGroup');
      throw error;
    }
  },

  deleteUserGroup: async (groupId) => {
    try {
      await api.delete(`/api/v1/admin/user-groups/${groupId}`);
      set((state) => ({ userGroups: state.userGroups.filter((g) => g.id !== groupId) }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'deleteUserGroup');
      throw error;
    }
  },

  // ── Warnings & Bans ───────────────────────────────────────────────

  warnUser: async (userId, warningTypeId, reason) => {
    try {
      const response = await api.post(`/api/v1/admin/users/${userId}/warnings`, {
        warning_type_id: warningTypeId,
        reason,
      });
      return response.data.warning as UserWarning;
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'warnUser');
      throw error;
    }
  },

  fetchUserWarnings: async (userId) => {
    try {
      const response = await api.get(`/api/v1/admin/users/${userId}/warnings`);
      return ensureArray<UserWarning>(response.data, 'warnings');
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchUserWarnings');
      return [];
    }
  },

  banUser: async (data) => {
    try {
      const response = await api.post('/api/v1/admin/bans', {
        user_id: data.userId,
        username: data.username,
        ip_address: data.ipAddress,
        email: data.email,
        reason: data.reason,
        expires_at: data.expiresAt,
        notes: data.notes,
      });
      return response.data.ban as Ban;
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'banUser');
      throw error;
    }
  },

  unbanUser: async (banId) => {
    try {
      await api.delete(`/api/v1/admin/bans/${banId}`);
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'unbanUser');
      throw error;
    }
  },

  fetchBans: async () => {
    try {
      const response = await api.get('/api/v1/admin/bans');
      return ensureArray<Ban>(response.data, 'bans');
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchBans');
      return [];
    }
  },

  // ── Moderation Queue ───────────────────────────────────────────────

  fetchModerationQueue: async () => {
    try {
      const response = await api.get('/api/v1/admin/moderation/queue');
      set({ moderationQueue: ensureArray<ModerationQueueItem>(response.data, 'items') });
    } catch (error: unknown) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
        'fetchModerationQueue'
      );
    }
  },

  approveQueueItem: async (itemId) => {
    try {
      await api.post(`/api/v1/admin/moderation/queue/${itemId}/approve`);
      set((state) => ({ moderationQueue: state.moderationQueue.filter((i) => i.id !== itemId) }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'approveQueueItem');
      throw error;
    }
  },

  rejectQueueItem: async (itemId, reason?) => {
    try {
      await api.post(`/api/v1/admin/moderation/queue/${itemId}/reject`, { reason });
      set((state) => ({ moderationQueue: state.moderationQueue.filter((i) => i.id !== itemId) }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'rejectQueueItem');
      throw error;
    }
  },

  // ── Reports ────────────────────────────────────────────────────────

  reportItem: async (data) => {
    const payload: Record<string, unknown> = {
      reason: data.reason,
      details: data.details,
      report_type: data.reportType,
      item_id: data.itemId,
    };
    const response = await api.post('/api/v1/reports', { report: payload });
    const report = ensureObject<Report>(response.data, 'report');
    if (report) {
      set((state) => ({ reports: [...state.reports, report] }));
      return report;
    }
    throw new Error('Failed to submit report');
  },

  fetchReports: async (status?) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/api/v1/admin/reports', { params });
      return ensureArray<Report>(response.data, 'reports');
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'fetchReports');
      return [];
    }
  },

  assignReport: async (reportId, moderatorId) => {
    try {
      await api.post(`/api/v1/admin/reports/${reportId}/assign`, { moderator_id: moderatorId });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'assignReport');
      throw error;
    }
  },

  resolveReport: async (reportId, resolution) => {
    try {
      await api.post(`/api/v1/admin/reports/${reportId}/resolve`, { resolution });
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'resolveReport');
      throw error;
    }
  },

  // ── Multi-Quote ────────────────────────────────────────────────────

  addToMultiQuote: (postId) => {
    set((state) => ({
      multiQuoteBuffer: state.multiQuoteBuffer.includes(postId)
        ? state.multiQuoteBuffer
        : [...state.multiQuoteBuffer, postId],
    }));
  },

  removeFromMultiQuote: (postId) => {
    set((state) => ({ multiQuoteBuffer: state.multiQuoteBuffer.filter((id) => id !== postId) }));
  },

  clearMultiQuote: () => set({ multiQuoteBuffer: [] }),

  // ── Thread Moderation ──────────────────────────────────────────────

  moveThread: async (threadId, targetForumId) => {
    try {
      await api.post(`/api/v1/posts/${threadId}/move`, { target_forum_id: targetForumId });
      set((state) => ({ posts: state.posts.filter((p) => p.id !== threadId) }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'moveThread');
      throw error;
    }
  },

  splitThread: async (threadId, postIds, newTitle) => {
    try {
      const response = await api.post(`/api/v1/posts/${threadId}/split`, {
        post_ids: postIds,
        new_title: newTitle,
      });
      return response.data.new_thread_id;
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'splitThread');
      throw error;
    }
  },

  mergeThreads: async (sourceThreadId, targetThreadId) => {
    try {
      await api.post(`/api/v1/posts/${sourceThreadId}/merge`, { target_thread_id: targetThreadId });
      set((state) => ({ posts: state.posts.filter((p) => p.id !== sourceThreadId) }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'mergeThreads');
      throw error;
    }
  },

  closeThread: async (threadId) => {
    try {
      await api.post(`/api/v1/posts/${threadId}/close`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === threadId ? { ...p, isLocked: true, isClosed: true } : p
        ),
        currentPost:
          state.currentPost?.id === threadId
            ? { ...state.currentPost, isLocked: true, isClosed: true }
            : state.currentPost,
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'closeThread');
      throw error;
    }
  },

  reopenThread: async (threadId) => {
    try {
      await api.post(`/api/v1/posts/${threadId}/reopen`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === threadId ? { ...p, isLocked: false, isClosed: false } : p
        ),
        currentPost:
          state.currentPost?.id === threadId
            ? { ...state.currentPost, isLocked: false, isClosed: false }
            : state.currentPost,
      }));
    } catch (error: unknown) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'reopenThread');
      throw error;
    }
  },
}));
