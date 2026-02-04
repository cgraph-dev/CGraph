/**
 * Moderation Module Types
 *
 * Type definitions for moderation functionality.
 *
 * @module modules/moderation/types
 * @version 1.0.0
 */

// Re-export store types for convenience
export type {
  WarningType,
  UserWarning,
  Ban,
  ModerationQueueItem,
  ModerationLogEntry,
  ThreadModerationResult,
  BulkSelection,
  UserModerationStats,
  ModerationState,
} from '../store/moderationStore.impl';

/**
 * Moderation action
 */
export type ModerationAction =
  | 'warn'
  | 'mute'
  | 'kick'
  | 'ban'
  | 'tempban'
  | 'unban'
  | 'delete_message'
  | 'delete_post'
  | 'lock_thread'
  | 'move_thread'
  | 'split_thread'
  | 'merge_threads';

/**
 * Report reason
 */
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'adult_content'
  | 'misinformation'
  | 'impersonation'
  | 'copyright'
  | 'other';

/**
 * User report
 */
export interface UserReport {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetUserId: string;
  targetUsername: string;
  reason: ReportReason;
  description: string;
  evidence?: ReportEvidence[];
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report evidence
 */
export interface ReportEvidence {
  type: 'message' | 'post' | 'screenshot' | 'link';
  contentId?: string;
  url?: string;
  description?: string;
}

/**
 * Content report
 */
export interface ContentReport {
  id: string;
  reporterId: string;
  reporterUsername: string;
  contentType: 'message' | 'post' | 'comment' | 'profile';
  contentId: string;
  contentPreview: string;
  reason: ReportReason;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
}

/**
 * Auto-moderation rule
 */
export interface AutoModerationRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: 'keyword' | 'regex' | 'mention_spam' | 'spam_content';
  triggerData: string[];
  exemptRoles: string[];
  exemptChannels: string[];
  actions: AutoModerationAction[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Auto-moderation action
 */
export interface AutoModerationAction {
  type: 'block_message' | 'delete_message' | 'timeout' | 'alert';
  duration?: number;
  alertChannelId?: string;
}

/**
 * Moderation note
 */
export interface ModerationNote {
  id: string;
  userId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

/**
 * User moderation history
 */
export interface UserModerationHistoryExtended {
  userId: string;
  username: string;
  totalWarningPoints: number;
  notes: ModerationNote[];
  reports: UserReport[];
}

/**
 * Ban appeal
 */
export interface BanAppeal {
  id: string;
  banId: string;
  userId: string;
  username: string;
  appealText: string;
  status: 'pending' | 'accepted' | 'denied';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

/**
 * Moderation stats
 */
export interface ModerationStats {
  totalWarnings: number;
  totalBans: number;
  totalReports: number;
  pendingReports: number;
  actionsToday: number;
  actionsThisWeek: number;
  topReportReasons: { reason: ReportReason; count: number }[];
}
