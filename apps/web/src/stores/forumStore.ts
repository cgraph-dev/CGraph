import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, ensureObject } from '@/lib/apiUtils';

export interface Forum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  customCss: string | null;
  isNsfw: boolean;
  isPrivate: boolean;
  isPublic: boolean;
  memberCount: number;
  // Voting fields for competition
  score: number;
  upvotes: number;
  downvotes: number;
  hotScore: number;
  weeklyScore: number;
  featured: boolean;
  userVote: 1 | -1 | 0;
  categories: ForumCategory[];
  moderators: ForumModerator[];
  isSubscribed: boolean;
  isMember: boolean;
  ownerId: string | null;
  createdAt: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  order: number;
  postCount: number;
}

export interface ForumModerator {
  id: string;
  forumId: string;
  userId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  permissions: string[];
  addedAt: string;
}

// MyBB Feature: Thread Prefixes
export interface ThreadPrefix {
  id: string;
  name: string;
  color: string;
  forums?: string[]; // Forum IDs where this prefix is allowed (optional)
  isDefault?: boolean; // Whether this is the default prefix
}

// MyBB Feature: Thread Rating
export interface ThreadRating {
  id: string;
  threadId: string;
  userId: string;
  rating: number; // 1-5 stars
  createdAt: string;
}

// MyBB Feature: Post Attachment
export interface PostAttachment {
  id: string;
  postId: string;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string;
  downloadUrl: string;
  downloads: number;
  uploadedBy: string;
  uploadedAt: string;
}

// MyBB Feature: Edit History
export interface PostEditHistory {
  id: string;
  postId: string;
  editedBy: string;
  editedByUsername: string;
  previousContent: string;
  reason?: string;
  editedAt: string;
}

// MyBB Feature: Poll
export interface Poll {
  id: string;
  threadId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  maxSelections?: number;
  timeout?: string; // ISO date when poll closes
  public: boolean; // Show who voted
  closed: boolean;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[]; // User IDs who voted (if public)
}

export interface Post {
  id: string;
  forumId: string;
  authorId: string;
  title: string;
  content: string;
  postType: 'text' | 'link' | 'image' | 'video' | 'poll';
  linkUrl: string | null;
  mediaUrls: string[];
  isPinned: boolean;
  isLocked: boolean;
  isNsfw: boolean;
  upvotes: number;
  downvotes: number;
  score: number;
  hotScore: number;
  commentCount: number;
  myVote: 1 | -1 | null;
  category: ForumCategory | null;
  // MyBB Features
  prefix?: ThreadPrefix | null; // Thread prefix ([SOLVED], [HELP], etc.)
  views: number; // View counter
  rating?: number; // Average rating (1-5 stars)
  ratingCount?: number; // Number of ratings
  myRating?: number | null; // Current user's rating
  isClosed?: boolean; // Thread closed (no new replies)
  attachments?: PostAttachment[]; // File attachments
  editHistory?: PostEditHistory[]; // Edit history
  isApproved?: boolean; // Moderation approval
  poll?: Poll | null; // Poll if postType is 'poll'
  author: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    reputation?: number; // User karma/reputation
  };
  forum: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null; // Last edit timestamp
  editedBy?: string | null; // Who edited
}

// MyBB Feature: Thread/Forum Subscriptions
export interface Subscription {
  id: string;
  userId: string;
  entityType: 'thread' | 'forum';
  entityId: string;
  notificationMode: 'none' | 'email' | 'instant' | 'digest'; // Email notification preference
  createdAt: string;
}

// MyBB Feature: User Groups & Permissions
export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  type: 'system' | 'custom' | 'joinable';
  isHidden: boolean; // Hide group membership
  isSuperMod: boolean; // Super moderator group
  canModerate: boolean;
  canAdmin: boolean;
  permissions: GroupPermissions;
  members?: number; // Member count
}

export interface GroupPermissions {
  // Forum permissions
  canViewForum: boolean;
  canPostThreads: boolean;
  canPostReplies: boolean;
  canPostPolls: boolean;
  canAttachFiles: boolean;
  canEditOwnPosts: boolean;
  canDeleteOwnPosts: boolean;
  canRateThreads: boolean;
  canUseReputation: boolean;
  // PM permissions
  canSendPM: boolean;
  maxPMRecipients: number;
  pmQuota: number;
  // Upload quota
  attachmentQuota: number; // MB
  // Moderation
  canEditPosts: boolean;
  canDeletePosts: boolean;
  canLockThreads: boolean;
  canMoveThreads: boolean;
  canSplitThreads: boolean;
  canMergeThreads: boolean;
  canWarnUsers: boolean;
  canBanUsers: boolean;
}

// MyBB Feature: Warning System
export interface UserWarning {
  id: string;
  userId: string;
  warningType: WarningType;
  points: number;
  reason: string;
  issuedBy: string;
  issuedByUsername: string;
  issuedAt: string;
  expiresAt?: string | null;
  isActive: boolean;
}

export interface WarningType {
  id: string;
  name: string;
  points: number;
  expiryDays: number;
  action?: 'moderate' | 'suspend' | 'ban'; // Action when threshold reached
}

// MyBB Feature: Ban System
export interface Ban {
  id: string;
  userId?: string | null;
  username?: string;
  ipAddress?: string | null;
  email?: string | null;
  reason: string;
  bannedBy: string;
  bannedByUsername: string;
  bannedAt: string;
  expiresAt?: string | null; // null = permanent
  isActive: boolean;
  notes?: string;
}

// MyBB Feature: Moderation Queue
export interface ModerationQueueItem {
  id: string;
  itemType: 'post' | 'thread' | 'comment';
  itemId: string;
  authorId: string;
  authorUsername: string;
  forumId: string;
  forumName: string;
  title?: string;
  content: string;
  reason: 'new_user' | 'flagged' | 'auto_spam' | 'manual';
  status: 'pending' | 'approved' | 'rejected';
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  createdAt: string;
}

// MyBB Feature: Report System
export interface Report {
  id: string;
  reportType: 'post' | 'comment' | 'user' | 'reputation';
  itemId: string;
  reportedBy: string;
  reportedByUsername: string;
  reason: string;
  details?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  assignedTo?: string | null;
  resolvedBy?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: 1 | -1 | null;
  isCollapsed: boolean;
  depth: number;
  children: Comment[];
  // MyBB Features
  attachments?: PostAttachment[];
  editHistory?: PostEditHistory[];
  isApproved?: boolean;
  author: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    reputation?: number;
  };
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  editedBy?: string | null;
}

type SortOption = 'hot' | 'new' | 'top' | 'controversial';
type LeaderboardSort = 'hot' | 'top' | 'new' | 'rising' | 'weekly' | 'members';
type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

interface LeaderboardMeta {
  page: number;
  perPage: number;
  total: number;
  sort: LeaderboardSort;
}

// MyBB Feature: Data interfaces for creating/updating
interface CreateThreadPrefixData {
  name: string;
  color: string;
  forums: string[]; // Forum IDs
}

interface CreatePollData {
  question: string;
  options: string[]; // Array of option texts
  allowMultiple: boolean;
  maxSelections?: number;
  timeout?: string; // ISO date
  public: boolean;
}

interface CreateUserGroupData {
  name: string;
  description?: string;
  color?: string;
  type: UserGroup['type'];
  permissions: Partial<GroupPermissions>;
}

interface UpdateUserGroupData {
  name?: string;
  description?: string;
  color?: string;
  permissions?: Partial<GroupPermissions>;
}

interface CreateBanData {
  userId?: string;
  username?: string;
  ipAddress?: string;
  email?: string;
  reason: string;
  expiresAt?: string | null; // ISO date or null for permanent
  notes?: string;
}

interface CreateReportData {
  reportType: Report['reportType'];
  itemId: string;
  reason: string;
  details?: string;
}

export interface ForumState {
  forums: Forum[];
  posts: Post[];
  currentPost: Post | null;
  currentForum: Forum | null;
  comments: Record<string, Comment[]>;
  subscribedForums: Forum[];
  // Leaderboard
  leaderboard: Forum[];
  leaderboardMeta: LeaderboardMeta | null;
  topForums: Forum[];
  isLoadingForums: boolean;
  isLoadingPosts: boolean;
  isLoadingComments: boolean;
  isLoadingLeaderboard: boolean;
  hasMorePosts: boolean;
  sortBy: SortOption;
  timeRange: TimeRange;

  // MyBB Features State
  threadPrefixes: ThreadPrefix[];
  subscriptions: Subscription[];
  userGroups: UserGroup[];
  moderationQueue: ModerationQueueItem[];
  reports: Report[];
  multiQuoteBuffer: string[]; // Post IDs to multi-quote

  // Actions
  fetchForums: () => Promise<void>;
  fetchForum: (slug: string) => Promise<Forum>;
  fetchPosts: (forumSlug?: string, page?: number) => Promise<void>;
  fetchPost: (postId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<Post>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<Comment>;
  vote: (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => Promise<void>;
  // Forum voting (competition)
  voteForum: (forumId: string, value: 1 | -1) => Promise<void>;
  fetchLeaderboard: (sort?: LeaderboardSort, page?: number) => Promise<void>;
  fetchTopForums: (limit?: number, sort?: LeaderboardSort) => Promise<void>;
  subscribe: (forumId: string) => Promise<void>;
  unsubscribe: (forumId: string) => Promise<void>;
  setSortBy: (sort: SortOption) => void;
  setTimeRange: (range: TimeRange) => void;
  createForum: (data: CreateForumData) => Promise<Forum>;
  updateForum: (forumId: string, data: UpdateForumData) => Promise<Forum>;
  deleteForum: (forumId: string) => Promise<void>;
  // Moderation actions
  pinPost: (forumId: string, postId: string) => Promise<void>;
  unpinPost: (forumId: string, postId: string) => Promise<void>;
  lockPost: (forumId: string, postId: string) => Promise<void>;
  unlockPost: (forumId: string, postId: string) => Promise<void>;
  deletePost: (forumId: string, postId: string) => Promise<void>;

  // MyBB Feature Actions
  // Thread Prefixes
  fetchThreadPrefixes: (forumId?: string) => Promise<void>;
  createThreadPrefix: (data: CreateThreadPrefixData) => Promise<ThreadPrefix>;
  deleteThreadPrefix: (prefixId: string) => Promise<void>;

  // Thread Ratings
  rateThread: (threadId: string, rating: number) => Promise<void>;
  fetchThreadRatings: (threadId: string) => Promise<ThreadRating[]>;

  // Attachments
  uploadAttachment: (file: File, postId?: string) => Promise<PostAttachment>;
  deleteAttachment: (attachmentId: string) => Promise<void>;

  // Edit History
  fetchEditHistory: (postId: string) => Promise<PostEditHistory[]>;

  // Polls
  createPoll: (threadId: string, data: CreatePollData) => Promise<Poll>;
  votePoll: (pollId: string, optionIds: string[]) => Promise<void>;
  closePoll: (pollId: string) => Promise<void>;

  // Subscriptions
  subscribeThread: (threadId: string, notificationMode: Subscription['notificationMode']) => Promise<void>;
  unsubscribeThread: (threadId: string) => Promise<void>;
  updateSubscription: (subscriptionId: string, notificationMode: Subscription['notificationMode']) => Promise<void>;
  fetchSubscriptions: () => Promise<void>;

  // User Groups
  fetchUserGroups: () => Promise<void>;
  createUserGroup: (data: CreateUserGroupData) => Promise<UserGroup>;
  updateUserGroup: (groupId: string, data: UpdateUserGroupData) => Promise<UserGroup>;
  deleteUserGroup: (groupId: string) => Promise<void>;

  // Warnings
  warnUser: (userId: string, warningTypeId: string, reason: string) => Promise<UserWarning>;
  fetchUserWarnings: (userId: string) => Promise<UserWarning[]>;

  // Bans
  banUser: (data: CreateBanData) => Promise<Ban>;
  unbanUser: (banId: string) => Promise<void>;
  fetchBans: () => Promise<Ban[]>;

  // Moderation Queue
  fetchModerationQueue: () => Promise<void>;
  approveQueueItem: (itemId: string) => Promise<void>;
  rejectQueueItem: (itemId: string, reason?: string) => Promise<void>;

  // Reports
  reportItem: (data: CreateReportData) => Promise<Report>;
  fetchReports: (status?: Report['status']) => Promise<Report[]>;
  assignReport: (reportId: string, moderatorId: string) => Promise<void>;
  resolveReport: (reportId: string, resolution: string) => Promise<void>;

  // Multi-quote
  addToMultiQuote: (postId: string) => void;
  removeFromMultiQuote: (postId: string) => void;
  clearMultiQuote: () => void;

  // Thread Moderation
  moveThread: (threadId: string, targetForumId: string) => Promise<void>;
  splitThread: (threadId: string, postIds: string[], newTitle: string) => Promise<void>;
  mergeThreads: (sourceThreadId: string, targetThreadId: string) => Promise<void>;
  closeThread: (threadId: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
}

interface CreatePostData {
  forumId: string;
  title: string;
  content?: string;
  postType: 'text' | 'link' | 'image' | 'video' | 'poll';
  linkUrl?: string;
  mediaUrls?: string[];
  categoryId?: string;
  isNsfw?: boolean;
  // MyBB features
  prefixId?: string;
  attachmentIds?: string[];
  // Poll data (when postType is 'poll')
  poll?: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
    isPublic?: boolean;
    expiresAt?: string;
  };
}

interface CreateForumData {
  name: string;
  description?: string;
  isNsfw?: boolean;
  isPrivate?: boolean;
}

interface UpdateForumData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  isNsfw?: boolean;
  iconUrl?: string;
  bannerUrl?: string;
  customCss?: string;
}

export const useForumStore = create<ForumState>((set, get) => ({
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

  // MyBB Features State Initialization
  threadPrefixes: [],
  subscriptions: [],
  userGroups: [],
  moderationQueue: [],
  reports: [],
  multiQuoteBuffer: [],

  fetchForums: async () => {
    set({ isLoadingForums: true });
    try {
      const response = await api.get('/api/v1/forums');
      const rawForums = ensureArray<Record<string, unknown>>(response.data, 'forums');
      const forums = rawForums.map(mapForumFromApi);
      set({
        forums,
        isLoadingForums: false,
      });
    } catch (error) {
      set({ isLoadingForums: false });
      throw error;
    }
  },

  fetchForum: async (slug: string) => {
    try {
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
    } catch (error) {
      throw error;
    }
  },

  fetchPosts: async (forumSlug?: string, page: number = 1) => {
    set({ isLoadingPosts: true });
    try {
      const { sortBy, timeRange } = get();
      const params: Record<string, string | number> = {
        sort: sortBy,
        page,
        limit: 25,
      };
      if (sortBy === 'top') {
        params.time = timeRange;
      }

      const endpoint = forumSlug
        ? `/api/v1/forums/${forumSlug}/posts`
        : '/api/v1/posts/feed';

      const response = await api.get(endpoint, { params });
      const newPosts = ensureArray<Post>(response.data, 'posts');

      set((state) => ({
        posts: page === 1 ? newPosts : [...state.posts, ...newPosts],
        hasMorePosts: newPosts.length === 25,
        isLoadingPosts: false,
      }));
    } catch (error) {
      set({ isLoadingPosts: false });
      throw error;
    }
  },

  fetchPost: async (postId: string) => {
    try {
      const response = await api.get(`/api/v1/posts/${postId}`);
      const post = ensureObject<Post>(response.data, 'post');
      set({ currentPost: post });
    } catch (error) {
      throw error;
    }
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
    } catch (error) {
      set({ isLoadingComments: false });
      throw error;
    }
  },

  createPost: async (data: CreatePostData) => {
    // Build request payload with all supported fields
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

    // Add MyBB features if present
    if (data.prefixId) {
      payload.prefix_id = data.prefixId;
    }
    if (data.attachmentIds && data.attachmentIds.length > 0) {
      payload.attachment_ids = data.attachmentIds;
    }

    // Add poll data if this is a poll post
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
      set((state) => ({
        posts: [post, ...state.posts],
      }));
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
          // Add as child to parent comment (simplified, actual tree logic more complex)
          return {
            comments: {
              ...state.comments,
              [postId]: postComments, // Would need proper tree insertion
            },
          };
        }
        return {
          comments: {
            ...state.comments,
            [postId]: [comment, ...postComments],
          },
        };
      });
      return comment;
    }
    throw new Error('Failed to create comment');
  },

  vote: async (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => {
    const endpoint = type === 'post' ? `/api/v1/posts/${id}/vote` : `/api/v1/comments/${id}/vote`;

    // Store previous state for rollback on error
    const previousPosts = get().posts;
    const previousCurrentPost = get().currentPost;

    // Optimistically update the UI first for better UX
    if (type === 'post') {
      set((state) => ({
        posts: state.posts.map((p) => {
          if (p.id !== id) return p;
          const oldVote = p.myVote;
          let upvotes = p.upvotes;
          let downvotes = p.downvotes;

          // Remove old vote
          if (oldVote === 1) upvotes--;
          if (oldVote === -1) downvotes--;

          // Add new vote
          if (value === 1) upvotes++;
          if (value === -1) downvotes++;

          return {
            ...p,
            myVote: value,
            upvotes,
            downvotes,
            score: upvotes - downvotes,
          };
        }),
        currentPost:
          state.currentPost?.id === id
            ? {
                ...state.currentPost,
                myVote: value,
              }
            : state.currentPost,
      }));
    }

    try {
      if (value === null) {
        await api.delete(endpoint);
      } else {
        await api.post(endpoint, { value });
      }
    } catch (error) {
      // Rollback optimistic update on error
      if (type === 'post') {
        set({ posts: previousPosts, currentPost: previousCurrentPost });
      }
      // Re-throw so callers can handle the error
      throw error;
    }
  },

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

  // Forum voting (competition)
  voteForum: async (forumId: string, value: 1 | -1) => {
    try {
      const response = await api.post(`/api/v1/forums/${forumId}/vote`, { value });
      const result = response.data;
      
      // Update forum in all lists
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
    } catch (error) {
      throw error;
    }
  },

  fetchLeaderboard: async (sort: LeaderboardSort = 'hot', page: number = 1) => {
    set({ isLoadingLeaderboard: true });
    try {
      const response = await api.get('/api/v1/forums/leaderboard', {
        params: { sort, page, per_page: 25 },
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawForums = ensureArray<any>(response.data, 'data');
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
    } catch (error) {
      set({ isLoadingLeaderboard: false });
      throw error;
    }
  },

  fetchTopForums: async (limit: number = 10, sort: LeaderboardSort = 'hot') => {
    try {
      const response = await api.get('/api/v1/forums/top', {
        params: { limit, sort },
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawForums = ensureArray<any>(response.data, 'data');
      const forums = rawForums.map(mapForumFromApi);
      set({ topForums: forums });
    } catch (error) {
      throw error;
    }
  },

  setSortBy: (sort: SortOption) => {
    set({ sortBy: sort, posts: [], hasMorePosts: true });
  },

  setTimeRange: (range: TimeRange) => {
    set({ timeRange: range, posts: [], hasMorePosts: true });
  },

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
        set((state) => ({
          forums: [forum, ...state.forums],
        }));
        return forum;
      }
      throw new Error('Failed to create forum - no forum returned');
    } catch (error) {
      console.error('[forumStore] createForum error:', error);
      throw error;
    }
  },

  updateForum: async (forumId: string, data: UpdateForumData) => {
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
        const mappedForum = mapForumFromApi(forum as unknown as Record<string, unknown>);
        set((state) => ({
          forums: state.forums.map((f) => (f.id === forumId ? mappedForum : f)),
        }));
        return mappedForum;
      }
      throw new Error('Failed to update forum');
    } catch (error) {
      console.error('[forumStore] updateForum error:', error);
      throw error;
    }
  },

  deleteForum: async (forumId: string) => {
    try {
      await api.delete(`/api/v1/forums/${forumId}`);
      set((state) => ({
        forums: state.forums.filter((f) => f.id !== forumId),
      }));
    } catch (error) {
      console.error('[forumStore] deleteForum error:', error);
      throw error;
    }
  },

  pinPost: async (forumId: string, postId: string) => {
    try {
      await api.post(`/api/v1/forums/${forumId}/posts/${postId}/pin`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, isPinned: true } : p
        ),
        currentPost: state.currentPost?.id === postId
          ? { ...state.currentPost, isPinned: true }
          : state.currentPost,
      }));
    } catch (error) {
      console.error('[forumStore] pinPost error:', error);
      throw error;
    }
  },

  unpinPost: async (forumId: string, postId: string) => {
    try {
      await api.delete(`/api/v1/forums/${forumId}/posts/${postId}/pin`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, isPinned: false } : p
        ),
        currentPost: state.currentPost?.id === postId
          ? { ...state.currentPost, isPinned: false }
          : state.currentPost,
      }));
    } catch (error) {
      console.error('[forumStore] unpinPost error:', error);
      throw error;
    }
  },

  lockPost: async (forumId: string, postId: string) => {
    try {
      await api.post(`/api/v1/forums/${forumId}/posts/${postId}/lock`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, isLocked: true } : p
        ),
        currentPost: state.currentPost?.id === postId
          ? { ...state.currentPost, isLocked: true }
          : state.currentPost,
      }));
    } catch (error) {
      console.error('[forumStore] lockPost error:', error);
      throw error;
    }
  },

  unlockPost: async (forumId: string, postId: string) => {
    try {
      await api.delete(`/api/v1/forums/${forumId}/posts/${postId}/lock`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, isLocked: false } : p
        ),
        currentPost: state.currentPost?.id === postId
          ? { ...state.currentPost, isLocked: false }
          : state.currentPost,
      }));
    } catch (error) {
      console.error('[forumStore] unlockPost error:', error);
      throw error;
    }
  },

  deletePost: async (forumId: string, postId: string) => {
    try {
      await api.delete(`/api/v1/forums/${forumId}/posts/${postId}`);
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
        currentPost: state.currentPost?.id === postId ? null : state.currentPost,
      }));
    } catch (error) {
      console.error('[forumStore] deletePost error:', error);
      throw error;
    }
  },

  // MyBB Feature implementations
  fetchThreadPrefixes: async (_forumId?: string) => {
    // Thread prefixes are stored inline with threads (prefix, prefix_color fields)
    // For now, provide a set of standard prefixes that can be used
    // TODO: When forum settings support custom prefixes, fetch from API
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
      set((state) => ({
        threadPrefixes: [...state.threadPrefixes, prefix],
      }));
      return prefix;
    } catch (error) {
      console.error('[forumStore] createThreadPrefix error:', error);
      throw error;
    }
  },
  deleteThreadPrefix: async (prefixId: string) => {
    try {
      await api.delete(`/api/v1/admin/thread-prefixes/${prefixId}`);
      set((state) => ({
        threadPrefixes: state.threadPrefixes.filter((p) => p.id !== prefixId),
      }));
    } catch (error) {
      console.error('[forumStore] deleteThreadPrefix error:', error);
      throw error;
    }
  },
  rateThread: async (threadId: string, rating: number) => {
    try {
      const response = await api.post(`/api/v1/posts/${threadId}/rate`, { rating });
      const result = response.data;
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === threadId
            ? { ...p, rating: result.average_rating, ratingCount: result.rating_count, myRating: rating }
            : p
        ),
        currentPost: state.currentPost?.id === threadId
          ? { ...state.currentPost, rating: result.average_rating, ratingCount: result.rating_count, myRating: rating }
          : state.currentPost,
      }));
    } catch (error) {
      console.error('[forumStore] rateThread error:', error);
      throw error;
    }
  },
  fetchThreadRatings: async (threadId: string) => {
    try {
      const response = await api.get(`/api/v1/posts/${threadId}/ratings`);
      return ensureArray<ThreadRating>(response.data, 'ratings');
    } catch (error) {
      console.error('[forumStore] fetchThreadRatings error:', error);
      return [];
    }
  },
  uploadAttachment: async (file: File, postId?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (postId) {
        formData.append('post_id', postId);
      }
      const response = await api.post('/api/v1/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.attachment as PostAttachment;
    } catch (error) {
      console.error('[forumStore] uploadAttachment error:', error);
      throw error;
    }
  },
  deleteAttachment: async (attachmentId: string) => {
    try {
      await api.delete(`/api/v1/attachments/${attachmentId}`);
    } catch (error) {
      console.error('[forumStore] deleteAttachment error:', error);
      throw error;
    }
  },
  fetchEditHistory: async (postId: string) => {
    try {
      const response = await api.get(`/api/v1/posts/${postId}/edit-history`);
      return ensureArray<PostEditHistory>(response.data, 'history');
    } catch (error) {
      console.error('[forumStore] fetchEditHistory error:', error);
      return [];
    }
  },
  createPoll: async (threadId: string, data) => {
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
    } catch (error) {
      console.error('[forumStore] createPoll error:', error);
      throw error;
    }
  },
  votePoll: async (pollId: string, optionIds: string[]) => {
    try {
      await api.post(`/api/v1/polls/${pollId}/vote`, { option_ids: optionIds });
    } catch (error) {
      console.error('[forumStore] votePoll error:', error);
      throw error;
    }
  },
  closePoll: async (pollId: string) => {
    try {
      await api.post(`/api/v1/polls/${pollId}/close`);
    } catch (error) {
      console.error('[forumStore] closePoll error:', error);
      throw error;
    }
  },
  subscribeThread: async (threadId: string, notificationMode) => {
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
            entityType: 'thread',
            entityId: threadId,
            notificationMode,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } catch (error) {
      console.error('[forumStore] subscribeThread error:', error);
      throw error;
    }
  },
  unsubscribeThread: async (threadId: string) => {
    try {
      await api.delete(`/api/v1/posts/${threadId}/subscribe`);
      set((state) => ({
        subscriptions: state.subscriptions.filter((s) => s.entityId !== threadId),
      }));
    } catch (error) {
      console.error('[forumStore] unsubscribeThread error:', error);
      throw error;
    }
  },
  updateSubscription: async (subscriptionId: string, notificationMode) => {
    try {
      await api.put(`/api/v1/subscriptions/${subscriptionId}`, {
        notification_mode: notificationMode,
      });
      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === subscriptionId ? { ...s, notificationMode } : s
        ),
      }));
    } catch (error) {
      console.error('[forumStore] updateSubscription error:', error);
      throw error;
    }
  },
  fetchSubscriptions: async () => {
    try {
      const response = await api.get('/api/v1/subscriptions');
      const subscriptions = ensureArray<Subscription>(response.data, 'subscriptions');
      set({ subscriptions });
    } catch (error) {
      console.error('[forumStore] fetchSubscriptions error:', error);
    }
  },
  fetchUserGroups: async () => {
    try {
      const response = await api.get('/api/v1/user-groups');
      const userGroups = ensureArray<UserGroup>(response.data, 'user_groups');
      set({ userGroups });
    } catch (error) {
      console.error('[forumStore] fetchUserGroups error:', error);
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
      set((state) => ({
        userGroups: [...state.userGroups, group],
      }));
      return group;
    } catch (error) {
      console.error('[forumStore] createUserGroup error:', error);
      throw error;
    }
  },
  updateUserGroup: async (groupId: string, data) => {
    try {
      const response = await api.put(`/api/v1/admin/user-groups/${groupId}`, {
        name: data.name,
        description: data.description,
        color: data.color,
        permissions: data.permissions,
      });
      const group = response.data.user_group as UserGroup;
      set((state) => ({
        userGroups: state.userGroups.map((g) => (g.id === groupId ? group : g)),
      }));
      return group;
    } catch (error) {
      console.error('[forumStore] updateUserGroup error:', error);
      throw error;
    }
  },
  deleteUserGroup: async (groupId: string) => {
    try {
      await api.delete(`/api/v1/admin/user-groups/${groupId}`);
      set((state) => ({
        userGroups: state.userGroups.filter((g) => g.id !== groupId),
      }));
    } catch (error) {
      console.error('[forumStore] deleteUserGroup error:', error);
      throw error;
    }
  },
  warnUser: async (userId: string, warningTypeId: string, reason: string) => {
    try {
      const response = await api.post(`/api/v1/admin/users/${userId}/warnings`, {
        warning_type_id: warningTypeId,
        reason,
      });
      return response.data.warning as UserWarning;
    } catch (error) {
      console.error('[forumStore] warnUser error:', error);
      throw error;
    }
  },
  fetchUserWarnings: async (userId: string) => {
    try {
      const response = await api.get(`/api/v1/admin/users/${userId}/warnings`);
      return ensureArray<UserWarning>(response.data, 'warnings');
    } catch (error) {
      console.error('[forumStore] fetchUserWarnings error:', error);
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
    } catch (error) {
      console.error('[forumStore] banUser error:', error);
      throw error;
    }
  },
  unbanUser: async (banId: string) => {
    try {
      await api.delete(`/api/v1/admin/bans/${banId}`);
    } catch (error) {
      console.error('[forumStore] unbanUser error:', error);
      throw error;
    }
  },
  fetchBans: async () => {
    try {
      const response = await api.get('/api/v1/admin/bans');
      return ensureArray<Ban>(response.data, 'bans');
    } catch (error) {
      console.error('[forumStore] fetchBans error:', error);
      return [];
    }
  },
  fetchModerationQueue: async () => {
    try {
      const response = await api.get('/api/v1/admin/moderation/queue');
      const queue = ensureArray<ModerationQueueItem>(response.data, 'items');
      set({ moderationQueue: queue });
    } catch (error) {
      console.error('[forumStore] fetchModerationQueue error:', error);
    }
  },
  approveQueueItem: async (itemId: string) => {
    try {
      await api.post(`/api/v1/admin/moderation/queue/${itemId}/approve`);
      set((state) => ({
        moderationQueue: state.moderationQueue.filter((i) => i.id !== itemId),
      }));
    } catch (error) {
      console.error('[forumStore] approveQueueItem error:', error);
      throw error;
    }
  },
  rejectQueueItem: async (itemId: string, reason?: string) => {
    try {
      await api.post(`/api/v1/admin/moderation/queue/${itemId}/reject`, { reason });
      set((state) => ({
        moderationQueue: state.moderationQueue.filter((i) => i.id !== itemId),
      }));
    } catch (error) {
      console.error('[forumStore] rejectQueueItem error:', error);
      throw error;
    }
  },
  reportItem: async (data) => {
    // Determine the correct endpoint based on report type
    let endpoint = '';
    const payload: Record<string, unknown> = {
      reason: data.reason,
      details: data.details,
    };

    switch (data.reportType) {
      case 'post':
        // The post report endpoint expects forum_id and post_id
        // We'll extract forum info from current state or use a general report endpoint
        endpoint = `/api/v1/reports`;
        payload.report_type = 'post';
        payload.item_id = data.itemId;
        break;
      case 'comment':
        endpoint = `/api/v1/reports`;
        payload.report_type = 'comment';
        payload.item_id = data.itemId;
        break;
      case 'user':
        endpoint = `/api/v1/reports`;
        payload.report_type = 'user';
        payload.item_id = data.itemId;
        break;
      default:
        endpoint = `/api/v1/reports`;
        payload.report_type = data.reportType;
        payload.item_id = data.itemId;
    }

    const response = await api.post(endpoint, { report: payload });
    const report = ensureObject<Report>(response.data, 'report');
    if (report) {
      set((state) => ({
        reports: [...state.reports, report],
      }));
      return report;
    }
    throw new Error('Failed to submit report');
  },
  fetchReports: async (status?) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/api/v1/admin/reports', { params });
      return ensureArray<Report>(response.data, 'reports');
    } catch (error) {
      console.error('[forumStore] fetchReports error:', error);
      return [];
    }
  },
  assignReport: async (reportId: string, moderatorId: string) => {
    try {
      await api.post(`/api/v1/admin/reports/${reportId}/assign`, {
        moderator_id: moderatorId,
      });
    } catch (error) {
      console.error('[forumStore] assignReport error:', error);
      throw error;
    }
  },
  resolveReport: async (reportId: string, resolution: string) => {
    try {
      await api.post(`/api/v1/admin/reports/${reportId}/resolve`, {
        resolution,
      });
    } catch (error) {
      console.error('[forumStore] resolveReport error:', error);
      throw error;
    }
  },
  addToMultiQuote: (postId: string) => {
    set((state) => ({
      multiQuoteBuffer: state.multiQuoteBuffer.includes(postId)
        ? state.multiQuoteBuffer
        : [...state.multiQuoteBuffer, postId],
    }));
  },
  removeFromMultiQuote: (postId: string) => {
    set((state) => ({
      multiQuoteBuffer: state.multiQuoteBuffer.filter((id) => id !== postId),
    }));
  },
  clearMultiQuote: () => {
    set({ multiQuoteBuffer: [] });
  },
  moveThread: async (threadId: string, targetForumId: string) => {
    try {
      await api.post(`/api/v1/posts/${threadId}/move`, {
        target_forum_id: targetForumId,
      });
      // Update local state - remove from current forum view
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== threadId),
      }));
    } catch (error) {
      console.error('[forumStore] moveThread error:', error);
      throw error;
    }
  },
  splitThread: async (threadId: string, postIds: string[], newTitle: string) => {
    try {
      const response = await api.post(`/api/v1/posts/${threadId}/split`, {
        post_ids: postIds,
        new_title: newTitle,
      });
      // Returns the new thread that was created
      return response.data.new_thread_id;
    } catch (error) {
      console.error('[forumStore] splitThread error:', error);
      throw error;
    }
  },
  mergeThreads: async (sourceThreadId: string, targetThreadId: string) => {
    try {
      await api.post(`/api/v1/posts/${sourceThreadId}/merge`, {
        target_thread_id: targetThreadId,
      });
      // Remove source thread from view
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== sourceThreadId),
      }));
    } catch (error) {
      console.error('[forumStore] mergeThreads error:', error);
      throw error;
    }
  },
  closeThread: async (threadId: string) => {
    try {
      await api.post(`/api/v1/posts/${threadId}/close`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === threadId ? { ...p, isLocked: true, isClosed: true } : p
        ),
        currentPost: state.currentPost?.id === threadId
          ? { ...state.currentPost, isLocked: true, isClosed: true }
          : state.currentPost,
      }));
    } catch (error) {
      console.error('[forumStore] closeThread error:', error);
      throw error;
    }
  },
  reopenThread: async (threadId: string) => {
    try {
      await api.post(`/api/v1/posts/${threadId}/reopen`);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === threadId ? { ...p, isLocked: false, isClosed: false } : p
        ),
        currentPost: state.currentPost?.id === threadId
          ? { ...state.currentPost, isLocked: false, isClosed: false }
          : state.currentPost,
      }));
    } catch (error) {
      console.error('[forumStore] reopenThread error:', error);
      throw error;
    }
  },
}));

// Helper to map API response to Forum type
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
    ownerId: owner?.id as string | null || null,
    createdAt: data.created_at as string,
  };
}
