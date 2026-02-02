/**
 * Zustand Slices Pattern - Forum Store Slices
 *
 * This file defines the slice pattern for the forum store, enabling better
 * separation of concerns and code organization. Each slice handles a
 * specific domain of the forum functionality.
 *
 * @module stores/slices/forum
 * @since v0.9.7
 */

import type { StateCreator } from 'zustand';
import type {
  Forum,
  Post,
  Comment,
  ThreadPrefix,
  Subscription,
  UserGroup,
  ModerationQueueItem,
  Report,
  UserWarning,
  Ban,
} from '../forumStore';

// ============================================================================
// Slice Types
// ============================================================================

type SortOption = 'hot' | 'new' | 'top' | 'controversial';
type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
type LeaderboardSort = 'hot' | 'top' | 'new' | 'rising' | 'weekly' | 'members';

interface LeaderboardMeta {
  page: number;
  perPage: number;
  total: number;
  sort: LeaderboardSort;
}

/**
 * Forums slice - manages forum list, current forum, and leaderboard
 */
export interface ForumsSlice {
  forums: Forum[];
  currentForum: Forum | null;
  subscribedForums: Forum[];
  leaderboard: Forum[];
  leaderboardMeta: LeaderboardMeta | null;
  topForums: Forum[];
  isLoadingForums: boolean;
  isLoadingLeaderboard: boolean;

  // Actions
  setForums: (forums: Forum[]) => void;
  setCurrentForum: (forum: Forum | null) => void;
  setSubscribedForums: (forums: Forum[]) => void;
  addForum: (forum: Forum) => void;
  updateForum: (forumId: string, updates: Partial<Forum>) => void;
  removeForum: (forumId: string) => void;
  setLoadingForums: (loading: boolean) => void;
  setLeaderboard: (forums: Forum[], meta: LeaderboardMeta) => void;
  setTopForums: (forums: Forum[]) => void;
  setLoadingLeaderboard: (loading: boolean) => void;
}

/**
 * Threads slice - manages posts/threads and current post
 */
export interface ThreadsSlice {
  posts: Post[];
  currentPost: Post | null;
  isLoadingPosts: boolean;
  hasMorePosts: boolean;
  sortBy: SortOption;
  timeRange: TimeRange;

  // Actions
  setPosts: (posts: Post[]) => void;
  appendPosts: (posts: Post[]) => void;
  setCurrentPost: (post: Post | null) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
  setLoadingPosts: (loading: boolean) => void;
  setHasMorePosts: (hasMore: boolean) => void;
  setSortBy: (sort: SortOption) => void;
  setTimeRange: (range: TimeRange) => void;
}

/**
 * Comments slice - manages comments/replies on posts
 */
export interface CommentsSlice {
  comments: Record<string, Comment[]>;
  isLoadingComments: boolean;

  // Actions
  setComments: (postId: string, comments: Comment[]) => void;
  addComment: (postId: string, comment: Comment) => void;
  updateComment: (postId: string, commentId: string, updates: Partial<Comment>) => void;
  removeComment: (postId: string, commentId: string) => void;
  setLoadingComments: (loading: boolean) => void;
}

/**
 * Voting slice - manages votes on forums, posts, and comments
 */
export interface VotingSlice {
  // Optimistic voting actions
  votePostOptimistic: (
    postId: string,
    value: 1 | -1 | null,
    userId: string
  ) => { previousVote: 1 | -1 | null; previousScore: number } | null;
  voteCommentOptimistic: (
    postId: string,
    commentId: string,
    value: 1 | -1 | null,
    userId: string
  ) => { previousVote: 1 | -1 | null; previousScore: number } | null;
  voteForumOptimistic: (
    forumId: string,
    value: 1 | -1
  ) => { previousVote: 1 | -1 | 0; previousScore: number } | null;
  revertPostVote: (postId: string, previousVote: 1 | -1 | null, previousScore: number) => void;
  revertCommentVote: (
    postId: string,
    commentId: string,
    previousVote: 1 | -1 | null,
    previousScore: number
  ) => void;
  revertForumVote: (forumId: string, previousVote: 1 | -1 | 0, previousScore: number) => void;
}

/**
 * Moderation slice - manages moderation queue, reports, warnings, bans
 */
export interface ModerationSlice {
  moderationQueue: ModerationQueueItem[];
  reports: Report[];
  userWarnings: UserWarning[];
  bans: Ban[];
  isLoadingModeration: boolean;

  // Actions
  setModerationQueue: (items: ModerationQueueItem[]) => void;
  removeFromQueue: (itemId: string) => void;
  setReports: (reports: Report[]) => void;
  updateReport: (reportId: string, updates: Partial<Report>) => void;
  setUserWarnings: (warnings: UserWarning[]) => void;
  setBans: (bans: Ban[]) => void;
  removeBan: (banId: string) => void;
  setLoadingModeration: (loading: boolean) => void;
}

/**
 * Features slice - manages MyBB-style features (prefixes, polls, subscriptions, groups)
 */
export interface FeaturesSlice {
  threadPrefixes: ThreadPrefix[];
  subscriptions: Subscription[];
  userGroups: UserGroup[];
  multiQuoteBuffer: string[];

  // Actions
  setThreadPrefixes: (prefixes: ThreadPrefix[]) => void;
  addThreadPrefix: (prefix: ThreadPrefix) => void;
  removeThreadPrefix: (prefixId: string) => void;
  setSubscriptions: (subscriptions: Subscription[]) => void;
  addSubscription: (subscription: Subscription) => void;
  removeSubscription: (subscriptionId: string) => void;
  updateSubscription: (subscriptionId: string, updates: Partial<Subscription>) => void;
  setUserGroups: (groups: UserGroup[]) => void;
  addUserGroup: (group: UserGroup) => void;
  updateUserGroup: (groupId: string, updates: Partial<UserGroup>) => void;
  removeUserGroup: (groupId: string) => void;
  addToMultiQuote: (postId: string) => void;
  removeFromMultiQuote: (postId: string) => void;
  clearMultiQuote: () => void;
}

/**
 * Combined forum store type from all slices
 */
export type ForumStoreSlices = ForumsSlice &
  ThreadsSlice &
  CommentsSlice &
  VotingSlice &
  ModerationSlice &
  FeaturesSlice;

// ============================================================================
// Slice Implementations
// ============================================================================

/**
 * Creates the Forums slice
 */
export const createForumsSlice: StateCreator<ForumStoreSlices, [], [], ForumsSlice> = (set) => ({
  forums: [],
  currentForum: null,
  subscribedForums: [],
  leaderboard: [],
  leaderboardMeta: null,
  topForums: [],
  isLoadingForums: false,
  isLoadingLeaderboard: false,

  setForums: (forums) => set({ forums }),
  setCurrentForum: (forum) => set({ currentForum: forum }),
  setSubscribedForums: (forums) => set({ subscribedForums: forums }),
  addForum: (forum) => set((state) => ({ forums: [...state.forums, forum] })),
  updateForum: (forumId, updates) =>
    set((state) => ({
      forums: state.forums.map((f) => (f.id === forumId ? { ...f, ...updates } : f)),
      currentForum:
        state.currentForum?.id === forumId
          ? { ...state.currentForum, ...updates }
          : state.currentForum,
    })),
  removeForum: (forumId) =>
    set((state) => ({
      forums: state.forums.filter((f) => f.id !== forumId),
      currentForum: state.currentForum?.id === forumId ? null : state.currentForum,
    })),
  setLoadingForums: (loading) => set({ isLoadingForums: loading }),
  setLeaderboard: (forums, meta) => set({ leaderboard: forums, leaderboardMeta: meta }),
  setTopForums: (forums) => set({ topForums: forums }),
  setLoadingLeaderboard: (loading) => set({ isLoadingLeaderboard: loading }),
});

/**
 * Creates the Threads slice
 */
export const createThreadsSlice: StateCreator<ForumStoreSlices, [], [], ThreadsSlice> = (set) => ({
  posts: [],
  currentPost: null,
  isLoadingPosts: false,
  hasMorePosts: true,
  sortBy: 'hot',
  timeRange: 'day',

  setPosts: (posts) => set({ posts }),
  appendPosts: (posts) => set((state) => ({ posts: [...state.posts, ...posts] })),
  setCurrentPost: (post) => set({ currentPost: post }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  updatePost: (postId, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, ...updates } : p)),
      currentPost:
        state.currentPost?.id === postId ? { ...state.currentPost, ...updates } : state.currentPost,
    })),
  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
      currentPost: state.currentPost?.id === postId ? null : state.currentPost,
    })),
  setLoadingPosts: (loading) => set({ isLoadingPosts: loading }),
  setHasMorePosts: (hasMore) => set({ hasMorePosts: hasMore }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setTimeRange: (range) => set({ timeRange: range }),
});

/**
 * Creates the Comments slice
 */
export const createCommentsSlice: StateCreator<ForumStoreSlices, [], [], CommentsSlice> = (
  set
) => ({
  comments: {},
  isLoadingComments: false,

  setComments: (postId, comments) =>
    set((state) => ({
      comments: { ...state.comments, [postId]: comments },
    })),
  addComment: (postId, comment) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: [...(state.comments[postId] || []), comment],
      },
    })),
  updateComment: (postId, commentId, updates) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: (state.comments[postId] || []).map((c) =>
          c.id === commentId ? { ...c, ...updates } : c
        ),
      },
    })),
  removeComment: (postId, commentId) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: (state.comments[postId] || []).filter((c) => c.id !== commentId),
      },
    })),
  setLoadingComments: (loading) => set({ isLoadingComments: loading }),
});

/**
 * Creates the Voting slice
 */
export const createVotingSlice: StateCreator<ForumStoreSlices, [], [], VotingSlice> = (
  set,
  get
) => ({
  votePostOptimistic: (postId, value, _userId) => {
    const state = get();
    const post = state.posts.find((p) => p.id === postId) || state.currentPost;
    if (!post || post.id !== postId) return null;

    const previousVote = post.myVote;
    const previousScore = post.score;

    // Calculate new score
    let scoreDelta = 0;
    if (previousVote === 1) scoreDelta -= 1;
    if (previousVote === -1) scoreDelta += 1;
    if (value === 1) scoreDelta += 1;
    if (value === -1) scoreDelta -= 1;

    const updates = {
      myVote: value,
      score: post.score + scoreDelta,
      upvotes: post.upvotes + (value === 1 ? 1 : 0) - (previousVote === 1 ? 1 : 0),
      downvotes: post.downvotes + (value === -1 ? 1 : 0) - (previousVote === -1 ? 1 : 0),
    };

    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, ...updates } : p)),
      currentPost:
        state.currentPost?.id === postId ? { ...state.currentPost, ...updates } : state.currentPost,
    }));

    return { previousVote, previousScore };
  },

  voteCommentOptimistic: (postId, commentId, value, _userId) => {
    const state = get();
    const comments = state.comments[postId] || [];
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return null;

    const previousVote = comment.myVote;
    const previousScore = comment.score;

    let scoreDelta = 0;
    if (previousVote === 1) scoreDelta -= 1;
    if (previousVote === -1) scoreDelta += 1;
    if (value === 1) scoreDelta += 1;
    if (value === -1) scoreDelta -= 1;

    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: (state.comments[postId] || []).map((c) =>
          c.id === commentId
            ? {
                ...c,
                myVote: value,
                score: c.score + scoreDelta,
                upvotes: c.upvotes + (value === 1 ? 1 : 0) - (previousVote === 1 ? 1 : 0),
                downvotes: c.downvotes + (value === -1 ? 1 : 0) - (previousVote === -1 ? 1 : 0),
              }
            : c
        ),
      },
    }));

    return { previousVote, previousScore };
  },

  voteForumOptimistic: (forumId, value) => {
    const state = get();
    const forum = state.forums.find((f) => f.id === forumId) || state.currentForum;
    if (!forum || forum.id !== forumId) return null;

    const previousVote = forum.userVote;
    const previousScore = forum.score;

    let scoreDelta = 0;
    if (previousVote === 1) scoreDelta -= 1;
    if (previousVote === -1) scoreDelta += 1;
    if (value === 1) scoreDelta += 1;
    if (value === -1) scoreDelta -= 1;

    const updates = {
      userVote: value,
      score: forum.score + scoreDelta,
      upvotes: forum.upvotes + (value === 1 ? 1 : 0) - (previousVote === 1 ? 1 : 0),
      downvotes: forum.downvotes + (value === -1 ? 1 : 0) - (previousVote === -1 ? 1 : 0),
    };

    set((state) => ({
      forums: state.forums.map((f) => (f.id === forumId ? { ...f, ...updates } : f)),
      currentForum:
        state.currentForum?.id === forumId
          ? { ...state.currentForum, ...updates }
          : state.currentForum,
    }));

    return { previousVote, previousScore };
  },

  revertPostVote: (postId, previousVote, previousScore) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, myVote: previousVote, score: previousScore } : p
      ),
      currentPost:
        state.currentPost?.id === postId
          ? { ...state.currentPost, myVote: previousVote, score: previousScore }
          : state.currentPost,
    }));
  },

  revertCommentVote: (postId, commentId, previousVote, previousScore) => {
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: (state.comments[postId] || []).map((c) =>
          c.id === commentId ? { ...c, myVote: previousVote, score: previousScore } : c
        ),
      },
    }));
  },

  revertForumVote: (forumId, previousVote, previousScore) => {
    set((state) => ({
      forums: state.forums.map((f) =>
        f.id === forumId ? { ...f, userVote: previousVote, score: previousScore } : f
      ),
      currentForum:
        state.currentForum?.id === forumId
          ? { ...state.currentForum, userVote: previousVote, score: previousScore }
          : state.currentForum,
    }));
  },
});

/**
 * Creates the Moderation slice
 */
export const createModerationSlice: StateCreator<ForumStoreSlices, [], [], ModerationSlice> = (
  set
) => ({
  moderationQueue: [],
  reports: [],
  userWarnings: [],
  bans: [],
  isLoadingModeration: false,

  setModerationQueue: (items) => set({ moderationQueue: items }),
  removeFromQueue: (itemId) =>
    set((state) => ({
      moderationQueue: state.moderationQueue.filter((i) => i.id !== itemId),
    })),
  setReports: (reports) => set({ reports }),
  updateReport: (reportId, updates) =>
    set((state) => ({
      reports: state.reports.map((r) => (r.id === reportId ? { ...r, ...updates } : r)),
    })),
  setUserWarnings: (warnings) => set({ userWarnings: warnings }),
  setBans: (bans) => set({ bans }),
  removeBan: (banId) =>
    set((state) => ({
      bans: state.bans.filter((b) => b.id !== banId),
    })),
  setLoadingModeration: (loading) => set({ isLoadingModeration: loading }),
});

/**
 * Creates the Features slice (MyBB-style features)
 */
export const createFeaturesSlice: StateCreator<ForumStoreSlices, [], [], FeaturesSlice> = (
  set
) => ({
  threadPrefixes: [],
  subscriptions: [],
  userGroups: [],
  multiQuoteBuffer: [],

  setThreadPrefixes: (prefixes) => set({ threadPrefixes: prefixes }),
  addThreadPrefix: (prefix) =>
    set((state) => ({ threadPrefixes: [...state.threadPrefixes, prefix] })),
  removeThreadPrefix: (prefixId) =>
    set((state) => ({
      threadPrefixes: state.threadPrefixes.filter((p) => p.id !== prefixId),
    })),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  addSubscription: (subscription) =>
    set((state) => ({ subscriptions: [...state.subscriptions, subscription] })),
  removeSubscription: (subscriptionId) =>
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== subscriptionId),
    })),
  updateSubscription: (subscriptionId, updates) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === subscriptionId ? { ...s, ...updates } : s
      ),
    })),
  setUserGroups: (groups) => set({ userGroups: groups }),
  addUserGroup: (group) => set((state) => ({ userGroups: [...state.userGroups, group] })),
  updateUserGroup: (groupId, updates) =>
    set((state) => ({
      userGroups: state.userGroups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    })),
  removeUserGroup: (groupId) =>
    set((state) => ({
      userGroups: state.userGroups.filter((g) => g.id !== groupId),
    })),
  addToMultiQuote: (postId) =>
    set((state) => ({
      multiQuoteBuffer: state.multiQuoteBuffer.includes(postId)
        ? state.multiQuoteBuffer
        : [...state.multiQuoteBuffer, postId],
    })),
  removeFromMultiQuote: (postId) =>
    set((state) => ({
      multiQuoteBuffer: state.multiQuoteBuffer.filter((id) => id !== postId),
    })),
  clearMultiQuote: () => set({ multiQuoteBuffer: [] }),
});
