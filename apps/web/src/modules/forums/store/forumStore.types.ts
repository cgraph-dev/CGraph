/**
 * Forum Store — Type Definitions
 *
 * All interfaces and types used across the forum module.
 * Includes core forum types, MyBB feature types (prefixes,
 * polls, ratings, groups, warnings, bans, reports, moderation).
 *
 * @module modules/forums/store/forumStore.types
 */

// ── Core Types ─────────────────────────────────────────────────────────

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
  threadCount?: number;
  postCount?: number;
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
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  permissions: string[];
  addedAt: string;
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
  // MyBB features
  prefix?: ThreadPrefix | null;
  views: number;
  rating?: number;
  ratingCount?: number;
  myRating?: number | null;
  isClosed?: boolean;
  attachments?: PostAttachment[];
  editHistory?: PostEditHistory[];
  isApproved?: boolean;
  poll?: Poll | null;
  author: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
    reputation?: number;
  };
  forum: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  editedBy?: string | null;
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
  userVote?: 1 | -1 | null;
  isCollapsed: boolean;
  depth: number;
  children: Comment[];
  isBestAnswer?: boolean;
  attachments?: PostAttachment[];
  editHistory?: PostEditHistory[];
  isApproved?: boolean;
  author: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
    reputation?: number;
  };
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  editedBy?: string | null;
}

// ── MyBB Feature Types ─────────────────────────────────────────────────

export interface ThreadPrefix {
  id: string;
  name: string;
  color: string;
  forums?: string[];
  isDefault?: boolean;
}

export interface ThreadRating {
  id: string;
  threadId: string;
  userId: string;
  rating: number;
  createdAt: string;
}

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

export interface PostEditHistory {
  id: string;
  postId: string;
  editedBy: string;
  editedByUsername: string;
  previousContent: string;
  reason?: string;
  editedAt: string;
}

export interface Poll {
  id: string;
  threadId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  maxSelections?: number;
  timeout?: string;
  public: boolean;
  closed: boolean;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  entityType: 'thread' | 'forum';
  entityId: string;
  notificationMode: 'none' | 'email' | 'instant' | 'digest';
  createdAt: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  type: 'system' | 'custom' | 'joinable';
  isHidden: boolean;
  isSuperMod: boolean;
  canModerate: boolean;
  canAdmin: boolean;
  permissions: GroupPermissions;
  members?: number;
}

export interface GroupPermissions {
  canViewForum: boolean;
  canPostThreads: boolean;
  canPostReplies: boolean;
  canPostPolls: boolean;
  canAttachFiles: boolean;
  canEditOwnPosts: boolean;
  canDeleteOwnPosts: boolean;
  canRateThreads: boolean;
  canUseReputation: boolean;
  canSendPM: boolean;
  maxPMRecipients: number;
  pmQuota: number;
  attachmentQuota: number;
  canEditPosts: boolean;
  canDeletePosts: boolean;
  canLockThreads: boolean;
  canMoveThreads: boolean;
  canSplitThreads: boolean;
  canMergeThreads: boolean;
  canWarnUsers: boolean;
  canBanUsers: boolean;
}

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
  action?: 'moderate' | 'suspend' | 'ban';
}

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
  expiresAt?: string | null;
  isActive: boolean;
  notes?: string;
}

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

// ── Sort / Filter Types ────────────────────────────────────────────────

export type SortOption = 'hot' | 'new' | 'top' | 'controversial';
export type LeaderboardSort = 'hot' | 'top' | 'new' | 'rising' | 'weekly' | 'members';
export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

export interface LeaderboardMeta {
  page: number;
  perPage: number;
  total: number;
  sort: LeaderboardSort;
}

// ── Input Data Types ───────────────────────────────────────────────────

export interface CreatePostData {
  forumId: string;
  title: string;
  content?: string;
  postType: 'text' | 'link' | 'image' | 'video' | 'poll';
  linkUrl?: string;
  mediaUrls?: string[];
  categoryId?: string;
  isNsfw?: boolean;
  prefixId?: string;
  attachmentIds?: string[];
  poll?: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
    isPublic?: boolean;
    expiresAt?: string;
  };
}

export interface CreateForumData {
  name: string;
  description?: string;
  isNsfw?: boolean;
  isPrivate?: boolean;
}

export interface UpdateForumData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  isNsfw?: boolean;
  iconUrl?: string;
  bannerUrl?: string;
  customCss?: string;
}

export interface CreateThreadPrefixData {
  name: string;
  color: string;
  forums: string[];
}

export interface CreatePollData {
  question: string;
  options: string[];
  allowMultiple: boolean;
  maxSelections?: number;
  timeout?: string;
  public: boolean;
}

export interface CreateUserGroupData {
  name: string;
  description?: string;
  color?: string;
  type: UserGroup['type'];
  permissions: Partial<GroupPermissions>;
}

export interface UpdateUserGroupData {
  name?: string;
  description?: string;
  color?: string;
  permissions?: Partial<GroupPermissions>;
}

export interface CreateBanData {
  userId?: string;
  username?: string;
  ipAddress?: string;
  email?: string;
  reason: string;
  expiresAt?: string | null;
  notes?: string;
}

export interface CreateReportData {
  reportType: Report['reportType'];
  itemId: string;
  reason: string;
  details?: string;
}

// ── Store State Interface ──────────────────────────────────────────────

export interface ForumState {
  forums: Forum[];
  posts: Post[];
  currentPost: Post | null;
  currentForum: Forum | null;
  comments: Record<string, Comment[]>;
  subscribedForums: Forum[];
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

  // MyBB features state
  threadPrefixes: ThreadPrefix[];
  subscriptions: Subscription[];
  userGroups: UserGroup[];
  moderationQueue: ModerationQueueItem[];
  reports: Report[];
  multiQuoteBuffer: string[];

  // Core actions
  fetchForums: () => Promise<void>;
  fetchForum: (slug: string) => Promise<Forum>;
  fetchPosts: (forumSlug?: string, page?: number) => Promise<void>;
  fetchPost: (postId: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  createPost: (data: CreatePostData) => Promise<Post>;
  createComment: (postId: string, content: string, parentId?: string) => Promise<Comment>;
  vote: (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => Promise<void>;
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

  // MyBB feature actions
  fetchThreadPrefixes: (forumId?: string) => Promise<void>;
  createThreadPrefix: (data: CreateThreadPrefixData) => Promise<ThreadPrefix>;
  deleteThreadPrefix: (prefixId: string) => Promise<void>;
  rateThread: (threadId: string, rating: number) => Promise<void>;
  fetchThreadRatings: (threadId: string) => Promise<ThreadRating[]>;
  uploadAttachment: (file: File, postId?: string) => Promise<PostAttachment>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  fetchEditHistory: (postId: string) => Promise<PostEditHistory[]>;
  createPoll: (threadId: string, data: CreatePollData) => Promise<Poll>;
  votePoll: (pollId: string, optionIds: string[]) => Promise<void>;
  closePoll: (pollId: string) => Promise<void>;
  subscribeThread: (
    threadId: string,
    notificationMode: Subscription['notificationMode']
  ) => Promise<void>;
  unsubscribeThread: (threadId: string) => Promise<void>;
  updateSubscription: (
    subscriptionId: string,
    notificationMode: Subscription['notificationMode']
  ) => Promise<void>;
  fetchSubscriptions: () => Promise<void>;
  fetchUserGroups: () => Promise<void>;
  createUserGroup: (data: CreateUserGroupData) => Promise<UserGroup>;
  updateUserGroup: (groupId: string, data: UpdateUserGroupData) => Promise<UserGroup>;
  deleteUserGroup: (groupId: string) => Promise<void>;
  warnUser: (userId: string, warningTypeId: string, reason: string) => Promise<UserWarning>;
  fetchUserWarnings: (userId: string) => Promise<UserWarning[]>;
  banUser: (data: CreateBanData) => Promise<Ban>;
  unbanUser: (banId: string) => Promise<void>;
  fetchBans: () => Promise<Ban[]>;
  fetchModerationQueue: () => Promise<void>;
  approveQueueItem: (itemId: string) => Promise<void>;
  rejectQueueItem: (itemId: string, reason?: string) => Promise<void>;
  reportItem: (data: CreateReportData) => Promise<Report>;
  fetchReports: (status?: Report['status']) => Promise<Report[]>;
  assignReport: (reportId: string, moderatorId: string) => Promise<void>;
  resolveReport: (reportId: string, resolution: string) => Promise<void>;
  addToMultiQuote: (postId: string) => void;
  removeFromMultiQuote: (postId: string) => void;
  clearMultiQuote: () => void;
  moveThread: (threadId: string, targetForumId: string) => Promise<void>;
  splitThread: (threadId: string, postIds: string[], newTitle: string) => Promise<void>;
  mergeThreads: (sourceThreadId: string, targetThreadId: string) => Promise<void>;
  closeThread: (threadId: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
  reset: () => void;
}
