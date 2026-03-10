/**
 * Forums Module Types
 *
 * Type definitions for forum functionality including categories, threads, and posts.
 *
 * @module modules/forums/types
 * @version 1.0.0
 */

/**
 * Forum visibility
 */
export type ForumVisibility = 'public' | 'members' | 'private';

/**
 * Thread status
 */
export type ThreadStatus = 'open' | 'closed' | 'archived';

/**
 * Post format
 */
export type PostFormat = 'markdown' | 'richtext' | 'plaintext';

/**
 * Forum category
 */
export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  parentId?: string;
  children?: ForumCategory[];
  forumCount: number;
  isHidden: boolean;
  createdAt: string;
}

/**
 * Forum
 */
export interface Forum {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  banner?: string;
  categoryId: string;
  category?: ForumCategory;
  visibility: ForumVisibility;
  threadCount: number;
  postCount: number;
  lastPost?: PostSummary;
  moderators: string[];
  rules?: string;
  pinnedThreads: string[];
  settings: ForumSettings;
  createdAt: string;
  updatedAt: string;
}

/**
 * Forum settings
 */
export interface ForumSettings {
  allowPolls: boolean;
  allowAttachments: boolean;
  allowRichText: boolean;
  allowCodeBlocks: boolean;
  requireApproval: boolean;
  minPostLength: number;
  maxPostLength: number;
  cooldownSeconds: number;
  allowAnonymousPosts: boolean;
  enableVoting: boolean;
  sortThreadsBy: 'latest' | 'popular' | 'votes';
}

/**
 * Thread
 */
export interface Thread {
  id: string;
  forumId: string;
  forum?: Forum;
  title: string;
  slug: string;
  authorId: string;
  author?: ThreadAuthor;
  content: string;
  contentFormat: PostFormat;
  status: ThreadStatus;
  isPinned: boolean;
  isLocked: boolean;
  isAnnouncement: boolean;
  isSolved: boolean;
  solvedPostId?: string;
  tags: string[];
  viewCount: number;
  replyCount: number;
  voteScore: number;
  userVote?: 1 | -1 | null;
  lastReply?: PostSummary;
  poll?: ThreadPoll;
  /** Content gating (Phase 31 — Discovery) */
  isContentGated?: boolean;
  gatePriceNodes?: number;
  gatePreviewChars?: number;
  createdAt: string;
  updatedAt: string;
  bumpedAt: string;
}

/**
 * Thread author
 */
export interface ThreadAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  badges: string[];
  postCount: number;
  joinedAt: string;
  isStaff: boolean;
  isModerator: boolean;
}

/**
 * Post
 */
export interface Post {
  id: string;
  threadId: string;
  thread?: Thread;
  authorId: string;
  author?: ThreadAuthor;
  content: string;
  contentFormat: PostFormat;
  replyToId?: string;
  replyTo?: Post;
  voteScore: number;
  userVote?: 1 | -1 | null;
  isSolution: boolean;
  isEdited: boolean;
  editHistory?: PostEdit[];
  attachments?: PostAttachment[];
  reactions?: PostReaction[];
  isHidden: boolean;
  hiddenReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Post summary (for previews)
 */
export interface PostSummary {
  id: string;
  threadId: string;
  authorId: string;
  authorUsername: string;
  authorAvatar?: string;
  excerpt: string;
  createdAt: string;
}

/**
 * Post edit history
 */
export interface PostEdit {
  id: string;
  content: string;
  editedBy: string;
  editedAt: string;
  reason?: string;
}

/**
 * Post attachment
 */
export interface PostAttachment {
  id: string;
  type: 'image' | 'file' | 'video' | 'embed';
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

/**
 * Post reaction
 */
export interface PostReaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

/**
 * Thread poll
 */
export interface ThreadPoll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  allowMultiple: boolean;
  showResults: 'always' | 'after_vote' | 'after_end';
  endsAt?: string;
  hasVoted: boolean;
  userVotes?: string[];
}

/**
 * Poll option
 */
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

/**
 * Thread filter options
 */
export interface ThreadFilterOptions {
  status?: ThreadStatus;
  authorId?: string;
  tags?: string[];
  hasPoll?: boolean;
  isSolved?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Thread sort options
 */
export type ThreadSortBy = 'latest' | 'oldest' | 'popular' | 'votes' | 'views' | 'replies';

/**
 * Forum notification settings
 */
export interface ForumNotificationSettings {
  newThreads: boolean;
  replies: boolean;
  mentions: boolean;
  subscribed: boolean;
}

/**
 * Thread subscription
 */
export interface ThreadSubscription {
  id: string;
  threadId: string;
  userId: string;
  notifyReplies: boolean;
  notifyMentions: boolean;
  createdAt: string;
}

/**
 * Forum stats
 */
export interface ForumStats {
  totalThreads: number;
  totalPosts: number;
  totalViews: number;
  activeUsers: number;
  postsToday: number;
  threadsToday: number;
  topContributors: Array<{
    userId: string;
    username: string;
    avatar?: string;
    postCount: number;
  }>;
}
