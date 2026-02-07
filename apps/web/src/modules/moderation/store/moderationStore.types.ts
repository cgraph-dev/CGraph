/**
 * Moderation Store Types
 *
 * Type definitions, interfaces, and union types for the moderation system.
 */

// Warning type definition
export interface WarningType {
  id: string;
  name: string;
  description: string;
  points: number;
  expiryDays: number; // 0 = never expires
  action?: 'none' | 'moderate' | 'suspend' | 'ban';
  actionThreshold?: number; // Points at which action triggers
}

// User warning
export interface UserWarning {
  id: string;
  userId: string;
  username: string;
  warningTypeId: string;
  warningTypeName: string;
  points: number;
  reason: string;
  notes?: string;
  issuedById: string;
  issuedByUsername: string;
  issuedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  isRevoked: boolean;
  revokedById?: string;
  revokedAt?: string;
  revokeReason?: string;
}

// Ban record
export interface Ban {
  id: string;
  userId: string | null;
  username: string | null;
  email: string | null;
  ipAddress: string | null;
  reason: string;
  notes?: string;
  bannedById: string;
  bannedByUsername: string;
  bannedAt: string;
  expiresAt: string | null; // null = permanent
  isActive: boolean;
  isLifted: boolean;
  liftedById?: string;
  liftedAt?: string;
  liftReason?: string;
}

// Moderation queue item
export interface ModerationQueueItem {
  id: string;
  itemType: 'thread' | 'post' | 'comment' | 'user' | 'attachment';
  itemId: string;
  authorId: string;
  authorUsername: string;
  forumId?: string;
  forumName?: string;
  title?: string;
  content: string;
  contentPreview: string;
  reason: 'new_user' | 'flagged' | 'auto_spam' | 'reported' | 'manual';
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'critical';
  reportCount: number;
  moderatedById?: string;
  moderatedAt?: string;
  moderationNotes?: string;
  createdAt: string;
}

// Moderation log entry
export interface ModerationLogEntry {
  id: string;
  action: string;
  targetType: 'thread' | 'post' | 'comment' | 'user' | 'forum';
  targetId: string;
  targetTitle?: string;
  moderatorId: string;
  moderatorUsername: string;
  reason?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

// Thread moderation actions result
export interface ThreadModerationResult {
  success: boolean;
  message: string;
  threadId?: string;
  newThreadId?: string; // For split operations
}

// Bulk moderation selection
export interface BulkSelection {
  threads: string[];
  posts: string[];
  comments: string[];
}

// User moderation stats
export interface UserModerationStats {
  userId: string;
  totalWarnings: number;
  activeWarnings: number;
  warningPoints: number;
  isBanned: boolean;
  isSuspended: boolean;
  suspendedUntil: string | null;
  postCount: number;
  reportedCount: number;
  approvalRate: number;
}

export interface ModerationState {
  // Moderation queue
  queue: ModerationQueueItem[];
  queueCounts: {
    pending: number;
    flagged: number;
    reported: number;
  };
  isLoadingQueue: boolean;

  // Warning types
  warningTypes: WarningType[];

  // User warnings (for user being viewed)
  currentUserWarnings: UserWarning[];
  currentUserStats: UserModerationStats | null;

  // Bans
  bans: Ban[];
  isLoadingBans: boolean;

  // Moderation log
  moderationLog: ModerationLogEntry[];
  isLoadingLog: boolean;

  // Bulk selection for inline moderation
  bulkSelection: BulkSelection;

  // Actions - Queue
  fetchModerationQueue: (filters?: {
    status?: 'pending' | 'all';
    itemType?: string;
    priority?: string;
  }) => Promise<void>;
  approveQueueItem: (itemId: string, notes?: string) => Promise<void>;
  rejectQueueItem: (itemId: string, reason: string, notes?: string) => Promise<void>;

  // Actions - Thread Moderation
  moveThread: (
    threadId: string,
    targetForumId: string,
    leaveRedirect?: boolean
  ) => Promise<ThreadModerationResult>;
  splitThread: (
    threadId: string,
    postIds: string[],
    newTitle: string,
    targetForumId?: string
  ) => Promise<ThreadModerationResult>;
  mergeThreads: (
    sourceThreadId: string,
    targetThreadId: string,
    mergePolls?: boolean
  ) => Promise<ThreadModerationResult>;
  copyThread: (threadId: string, targetForumId: string) => Promise<ThreadModerationResult>;
  closeThread: (threadId: string, reason?: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
  softDeleteThread: (threadId: string, reason?: string) => Promise<void>;
  restoreThread: (threadId: string) => Promise<void>;
  approveThread: (threadId: string) => Promise<void>;
  unapproveThread: (threadId: string) => Promise<void>;

  // Actions - Post Moderation
  movePost: (postId: string, targetThreadId: string) => Promise<void>;
  softDeletePost: (postId: string, reason?: string) => Promise<void>;
  restorePost: (postId: string) => Promise<void>;
  approvePost: (postId: string) => Promise<void>;
  unapprovePost: (postId: string) => Promise<void>;

  // Actions - Bulk Moderation
  toggleBulkSelection: (type: 'threads' | 'posts' | 'comments', id: string) => void;
  clearBulkSelection: () => void;
  bulkMoveThreads: (targetForumId: string) => Promise<void>;
  bulkDeleteThreads: (reason?: string) => Promise<void>;
  bulkLockThreads: () => Promise<void>;
  bulkApproveThreads: () => Promise<void>;

  // Actions - User Moderation
  fetchUserModerationStats: (userId: string) => Promise<UserModerationStats>;
  fetchUserWarnings: (userId: string) => Promise<UserWarning[]>;
  issueWarning: (
    userId: string,
    warningTypeId: string,
    reason: string,
    notes?: string
  ) => Promise<UserWarning>;
  revokeWarning: (warningId: string, reason: string) => Promise<void>;

  // Actions - Bans
  fetchBans: (filters?: { active?: boolean }) => Promise<void>;
  banUser: (data: {
    userId?: string;
    username?: string;
    email?: string;
    ipAddress?: string;
    reason: string;
    expiresAt?: string | null;
    notes?: string;
  }) => Promise<Ban>;
  liftBan: (banId: string, reason: string) => Promise<void>;

  // Actions - Warning Types
  fetchWarningTypes: () => Promise<void>;

  // Actions - Moderation Log
  fetchModerationLog: (filters?: {
    moderatorId?: string;
    action?: string;
    targetType?: string;
    page?: number;
  }) => Promise<void>;

  // Utility
  logModAction: (
    action: string,
    targetType: string,
    targetId: string,
    reason?: string,
    details?: Record<string, unknown>
  ) => Promise<void>;
}
