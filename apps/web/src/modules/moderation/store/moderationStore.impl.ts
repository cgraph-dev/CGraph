import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, ensureObject } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ModerationStore');

/**
 * Moderation Store
 *
 * Comprehensive moderation system for MyBB-style forums:
 * - Thread moderation (split, merge, move, lock, pin, delete)
 * - Post moderation (approve, soft-delete, restore, move)
 * - User moderation (warn, ban, mute)
 * - Moderation queue
 * - Warning system
 * - Ban management
 * - Inline moderation (bulk actions)
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

export const useModerationStore = create<ModerationState>((set, get) => ({
  queue: [],
  queueCounts: { pending: 0, flagged: 0, reported: 0 },
  isLoadingQueue: false,
  warningTypes: [],
  currentUserWarnings: [],
  currentUserStats: null,
  bans: [],
  isLoadingBans: false,
  moderationLog: [],
  isLoadingLog: false,
  bulkSelection: { threads: [], posts: [], comments: [] },

  // ========================================
  // MODERATION QUEUE
  // ========================================

  fetchModerationQueue: async (filters = {}) => {
    set({ isLoadingQueue: true });
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.itemType) params.item_type = filters.itemType;
      if (filters.priority) params.priority = filters.priority;

      const response = await api.get('/api/v1/admin/moderation/queue', { params });
      const items = (ensureArray(response.data, 'items') as Record<string, unknown>[]).map(
        (item) => ({
          id: item.id as string,
          itemType: item.item_type as ModerationQueueItem['itemType'],
          itemId: item.item_id as string,
          authorId: item.author_id as string,
          authorUsername: item.author_username as string,
          forumId: item.forum_id as string | undefined,
          forumName: item.forum_name as string | undefined,
          title: item.title as string | undefined,
          content: item.content as string,
          contentPreview:
            (item.content_preview as string) || (item.content as string).slice(0, 200),
          reason: item.reason as ModerationQueueItem['reason'],
          status: item.status as ModerationQueueItem['status'],
          priority: item.priority as ModerationQueueItem['priority'],
          reportCount: (item.report_count as number) || 0,
          moderatedById: item.moderated_by_id as string | undefined,
          moderatedAt: item.moderated_at as string | undefined,
          moderationNotes: item.moderation_notes as string | undefined,
          createdAt: (item.created_at as string) || (item.inserted_at as string),
        })
      );

      const counts = response.data.counts || {};
      set({
        queue: items,
        queueCounts: {
          pending:
            counts.pending ||
            items.filter((i: ModerationQueueItem) => i.status === 'pending').length,
          flagged: counts.flagged || 0,
          reported: counts.reported || 0,
        },
        isLoadingQueue: false,
      });
    } catch (error) {
      logger.error(' Failed to fetch queue:', error);
      set({ isLoadingQueue: false });
      throw error;
    }
  },

  approveQueueItem: async (itemId: string, notes?: string) => {
    try {
      await api.post(`/api/v1/admin/moderation/queue/${itemId}/approve`, { notes });
      set((state) => ({
        queue: state.queue.map((item) =>
          item.id === itemId ? { ...item, status: 'approved' as const } : item
        ),
        queueCounts: {
          ...state.queueCounts,
          pending: Math.max(0, state.queueCounts.pending - 1),
        },
      }));
    } catch (error) {
      logger.error(' Failed to approve item:', error);
      throw error;
    }
  },

  rejectQueueItem: async (itemId: string, reason: string, notes?: string) => {
    try {
      await api.post(`/api/v1/admin/moderation/queue/${itemId}/reject`, { reason, notes });
      set((state) => ({
        queue: state.queue.map((item) =>
          item.id === itemId ? { ...item, status: 'rejected' as const } : item
        ),
        queueCounts: {
          ...state.queueCounts,
          pending: Math.max(0, state.queueCounts.pending - 1),
        },
      }));
    } catch (error) {
      logger.error(' Failed to reject item:', error);
      throw error;
    }
  },

  // ========================================
  // THREAD MODERATION
  // ========================================

  moveThread: async (threadId: string, targetForumId: string, leaveRedirect = false) => {
    try {
      const response = await api.post(`/api/v1/admin/threads/${threadId}/move`, {
        target_forum_id: targetForumId,
        leave_redirect: leaveRedirect,
      });
      await get().logModAction('move_thread', 'thread', threadId, undefined, { targetForumId });
      return {
        success: true,
        message: response.data.message || 'Thread moved successfully',
        threadId,
      };
    } catch (error) {
      logger.error(' Failed to move thread:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to move thread',
      };
    }
  },

  splitThread: async (
    threadId: string,
    postIds: string[],
    newTitle: string,
    targetForumId?: string
  ) => {
    try {
      const response = await api.post(`/api/v1/admin/threads/${threadId}/split`, {
        post_ids: postIds,
        new_title: newTitle,
        target_forum_id: targetForumId,
      });
      await get().logModAction('split_thread', 'thread', threadId, undefined, {
        postIds,
        newTitle,
      });
      return {
        success: true,
        message: response.data.message || 'Thread split successfully',
        threadId,
        newThreadId: response.data.new_thread_id,
      };
    } catch (error) {
      logger.error(' Failed to split thread:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to split thread',
      };
    }
  },

  mergeThreads: async (sourceThreadId: string, targetThreadId: string, mergePolls = false) => {
    try {
      const response = await api.post(`/api/v1/admin/threads/${sourceThreadId}/merge`, {
        target_thread_id: targetThreadId,
        merge_polls: mergePolls,
      });
      await get().logModAction('merge_threads', 'thread', sourceThreadId, undefined, {
        targetThreadId,
      });
      return {
        success: true,
        message: response.data.message || 'Threads merged successfully',
        threadId: targetThreadId,
      };
    } catch (error) {
      logger.error(' Failed to merge threads:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to merge threads',
      };
    }
  },

  copyThread: async (threadId: string, targetForumId: string) => {
    try {
      const response = await api.post(`/api/v1/admin/threads/${threadId}/copy`, {
        target_forum_id: targetForumId,
      });
      await get().logModAction('copy_thread', 'thread', threadId, undefined, { targetForumId });
      return {
        success: true,
        message: response.data.message || 'Thread copied successfully',
        threadId,
        newThreadId: response.data.new_thread_id,
      };
    } catch (error) {
      logger.error(' Failed to copy thread:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to copy thread',
      };
    }
  },

  closeThread: async (threadId: string, reason?: string) => {
    try {
      await api.post(`/api/v1/admin/threads/${threadId}/close`, { reason });
      await get().logModAction('close_thread', 'thread', threadId, reason);
    } catch (error) {
      logger.error(' Failed to close thread:', error);
      throw error;
    }
  },

  reopenThread: async (threadId: string) => {
    try {
      await api.post(`/api/v1/admin/threads/${threadId}/reopen`);
      await get().logModAction('reopen_thread', 'thread', threadId);
    } catch (error) {
      logger.error(' Failed to reopen thread:', error);
      throw error;
    }
  },

  softDeleteThread: async (threadId: string, reason?: string) => {
    try {
      await api.post(`/api/v1/admin/threads/${threadId}/soft-delete`, { reason });
      await get().logModAction('soft_delete_thread', 'thread', threadId, reason);
    } catch (error) {
      logger.error(' Failed to soft-delete thread:', error);
      throw error;
    }
  },

  restoreThread: async (threadId: string) => {
    try {
      await api.post(`/api/v1/admin/threads/${threadId}/restore`);
      await get().logModAction('restore_thread', 'thread', threadId);
    } catch (error) {
      logger.error(' Failed to restore thread:', error);
      throw error;
    }
  },

  approveThread: async (threadId: string) => {
    try {
      await api.post(`/api/v1/admin/threads/${threadId}/approve`);
      await get().logModAction('approve_thread', 'thread', threadId);
    } catch (error) {
      logger.error(' Failed to approve thread:', error);
      throw error;
    }
  },

  unapproveThread: async (threadId: string) => {
    try {
      await api.post(`/api/v1/admin/threads/${threadId}/unapprove`);
      await get().logModAction('unapprove_thread', 'thread', threadId);
    } catch (error) {
      logger.error(' Failed to unapprove thread:', error);
      throw error;
    }
  },

  // ========================================
  // POST MODERATION
  // ========================================

  movePost: async (postId: string, targetThreadId: string) => {
    try {
      await api.post(`/api/v1/admin/posts/${postId}/move`, {
        target_thread_id: targetThreadId,
      });
      await get().logModAction('move_post', 'post', postId, undefined, { targetThreadId });
    } catch (error) {
      logger.error(' Failed to move post:', error);
      throw error;
    }
  },

  softDeletePost: async (postId: string, reason?: string) => {
    try {
      await api.post(`/api/v1/admin/posts/${postId}/soft-delete`, { reason });
      await get().logModAction('soft_delete_post', 'post', postId, reason);
    } catch (error) {
      logger.error(' Failed to soft-delete post:', error);
      throw error;
    }
  },

  restorePost: async (postId: string) => {
    try {
      await api.post(`/api/v1/admin/posts/${postId}/restore`);
      await get().logModAction('restore_post', 'post', postId);
    } catch (error) {
      logger.error(' Failed to restore post:', error);
      throw error;
    }
  },

  approvePost: async (postId: string) => {
    try {
      await api.post(`/api/v1/admin/posts/${postId}/approve`);
      await get().logModAction('approve_post', 'post', postId);
    } catch (error) {
      logger.error(' Failed to approve post:', error);
      throw error;
    }
  },

  unapprovePost: async (postId: string) => {
    try {
      await api.post(`/api/v1/admin/posts/${postId}/unapprove`);
      await get().logModAction('unapprove_post', 'post', postId);
    } catch (error) {
      logger.error(' Failed to unapprove post:', error);
      throw error;
    }
  },

  // ========================================
  // BULK MODERATION (Inline)
  // ========================================

  toggleBulkSelection: (type: 'threads' | 'posts' | 'comments', id: string) => {
    set((state) => {
      const current = state.bulkSelection[type];
      const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      return {
        bulkSelection: {
          ...state.bulkSelection,
          [type]: updated,
        },
      };
    });
  },

  clearBulkSelection: () => {
    set({ bulkSelection: { threads: [], posts: [], comments: [] } });
  },

  bulkMoveThreads: async (targetForumId: string) => {
    const threadIds = get().bulkSelection.threads;
    if (threadIds.length === 0) return;

    try {
      await api.post('/api/v1/admin/threads/bulk/move', {
        thread_ids: threadIds,
        target_forum_id: targetForumId,
      });
      get().clearBulkSelection();
    } catch (error) {
      logger.error(' Failed to bulk move threads:', error);
      throw error;
    }
  },

  bulkDeleteThreads: async (reason?: string) => {
    const threadIds = get().bulkSelection.threads;
    if (threadIds.length === 0) return;

    try {
      await api.post('/api/v1/admin/threads/bulk/delete', {
        thread_ids: threadIds,
        reason,
      });
      get().clearBulkSelection();
    } catch (error) {
      logger.error(' Failed to bulk delete threads:', error);
      throw error;
    }
  },

  bulkLockThreads: async () => {
    const threadIds = get().bulkSelection.threads;
    if (threadIds.length === 0) return;

    try {
      await api.post('/api/v1/admin/threads/bulk/lock', {
        thread_ids: threadIds,
      });
      get().clearBulkSelection();
    } catch (error) {
      logger.error(' Failed to bulk lock threads:', error);
      throw error;
    }
  },

  bulkApproveThreads: async () => {
    const threadIds = get().bulkSelection.threads;
    if (threadIds.length === 0) return;

    try {
      await api.post('/api/v1/admin/threads/bulk/approve', {
        thread_ids: threadIds,
      });
      get().clearBulkSelection();
    } catch (error) {
      logger.error(' Failed to bulk approve threads:', error);
      throw error;
    }
  },

  // ========================================
  // USER MODERATION
  // ========================================

  fetchUserModerationStats: async (userId: string) => {
    try {
      const response = await api.get(`/api/v1/admin/users/${userId}/moderation`);
      const data = response.data;
      const stats: UserModerationStats = {
        userId,
        totalWarnings: data.total_warnings || 0,
        activeWarnings: data.active_warnings || 0,
        warningPoints: data.warning_points || 0,
        isBanned: data.is_banned || false,
        isSuspended: data.is_suspended || false,
        suspendedUntil: data.suspended_until || null,
        postCount: data.post_count || 0,
        reportedCount: data.reported_count || 0,
        approvalRate: data.approval_rate || 100,
      };
      set({ currentUserStats: stats });
      return stats;
    } catch (error) {
      logger.error(' Failed to fetch user moderation stats:', error);
      throw error;
    }
  },

  fetchUserWarnings: async (userId: string) => {
    try {
      const response = await api.get(`/api/v1/admin/users/${userId}/warnings`);
      const warnings = (ensureArray(response.data, 'warnings') as Record<string, unknown>[]).map(
        (w) => ({
          id: w.id as string,
          userId: w.user_id as string,
          username: w.username as string,
          warningTypeId: w.warning_type_id as string,
          warningTypeName: w.warning_type_name as string,
          points: w.points as number,
          reason: w.reason as string,
          notes: w.notes as string | undefined,
          issuedById: w.issued_by_id as string,
          issuedByUsername: w.issued_by_username as string,
          issuedAt: w.issued_at as string,
          expiresAt: w.expires_at as string | null,
          isActive: w.is_active as boolean,
          isRevoked: w.is_revoked as boolean,
          revokedById: w.revoked_by_id as string | undefined,
          revokedAt: w.revoked_at as string | undefined,
          revokeReason: w.revoke_reason as string | undefined,
        })
      );
      set({ currentUserWarnings: warnings });
      return warnings;
    } catch (error) {
      logger.error(' Failed to fetch user warnings:', error);
      throw error;
    }
  },

  issueWarning: async (userId: string, warningTypeId: string, reason: string, notes?: string) => {
    try {
      const response = await api.post(`/api/v1/admin/users/${userId}/warnings`, {
        warning_type_id: warningTypeId,
        reason,
        notes,
      });
      const warning = ensureObject(response.data, 'warning') as Record<string, unknown>;
      const newWarning: UserWarning = {
        id: warning.id as string,
        userId,
        username: warning.username as string,
        warningTypeId,
        warningTypeName: warning.warning_type_name as string,
        points: warning.points as number,
        reason,
        notes,
        issuedById: warning.issued_by_id as string,
        issuedByUsername: warning.issued_by_username as string,
        issuedAt: (warning.issued_at as string) || new Date().toISOString(),
        expiresAt: warning.expires_at as string | null,
        isActive: true,
        isRevoked: false,
      };
      set((state) => ({
        currentUserWarnings: [newWarning, ...state.currentUserWarnings],
      }));
      return newWarning;
    } catch (error) {
      logger.error(' Failed to issue warning:', error);
      throw error;
    }
  },

  revokeWarning: async (warningId: string, reason: string) => {
    try {
      await api.post(`/api/v1/admin/warnings/${warningId}/revoke`, { reason });
      set((state) => ({
        currentUserWarnings: state.currentUserWarnings.map((w) =>
          w.id === warningId ? { ...w, isActive: false, isRevoked: true, revokeReason: reason } : w
        ),
      }));
    } catch (error) {
      logger.error(' Failed to revoke warning:', error);
      throw error;
    }
  },

  // ========================================
  // BANS
  // ========================================

  fetchBans: async (filters = {}) => {
    set({ isLoadingBans: true });
    try {
      const params: Record<string, string> = {};
      if (filters.active !== undefined) params.active = String(filters.active);

      const response = await api.get('/api/v1/admin/bans', { params });
      const bans = (ensureArray(response.data, 'bans') as Record<string, unknown>[]).map((b) => ({
        id: b.id as string,
        userId: b.user_id as string | null,
        username: b.username as string | null,
        email: b.email as string | null,
        ipAddress: b.ip_address as string | null,
        reason: b.reason as string,
        notes: b.notes as string | undefined,
        bannedById: b.banned_by_id as string,
        bannedByUsername: b.banned_by_username as string,
        bannedAt: b.banned_at as string,
        expiresAt: b.expires_at as string | null,
        isActive: b.is_active as boolean,
        isLifted: b.is_lifted as boolean,
        liftedById: b.lifted_by_id as string | undefined,
        liftedAt: b.lifted_at as string | undefined,
        liftReason: b.lift_reason as string | undefined,
      }));
      set({ bans, isLoadingBans: false });
    } catch (error) {
      logger.error(' Failed to fetch bans:', error);
      set({ isLoadingBans: false });
      throw error;
    }
  },

  banUser: async (data) => {
    try {
      const response = await api.post('/api/v1/admin/bans', {
        user_id: data.userId,
        username: data.username,
        email: data.email,
        ip_address: data.ipAddress,
        reason: data.reason,
        expires_at: data.expiresAt,
        notes: data.notes,
      });
      const ban = ensureObject(response.data, 'ban') as Record<string, unknown>;
      const newBan: Ban = {
        id: ban.id as string,
        userId: data.userId || null,
        username: data.username || null,
        email: data.email || null,
        ipAddress: data.ipAddress || null,
        reason: data.reason,
        notes: data.notes,
        bannedById: ban.banned_by_id as string,
        bannedByUsername: ban.banned_by_username as string,
        bannedAt: (ban.banned_at as string) || new Date().toISOString(),
        expiresAt: data.expiresAt || null,
        isActive: true,
        isLifted: false,
      };
      set((state) => ({
        bans: [newBan, ...state.bans],
      }));
      return newBan;
    } catch (error) {
      logger.error(' Failed to ban user:', error);
      throw error;
    }
  },

  liftBan: async (banId: string, reason: string) => {
    try {
      await api.post(`/api/v1/admin/bans/${banId}/lift`, { reason });
      set((state) => ({
        bans: state.bans.map((b) =>
          b.id === banId ? { ...b, isActive: false, isLifted: true, liftReason: reason } : b
        ),
      }));
    } catch (error) {
      logger.error(' Failed to lift ban:', error);
      throw error;
    }
  },

  // ========================================
  // WARNING TYPES
  // ========================================

  fetchWarningTypes: async () => {
    try {
      const response = await api.get('/api/v1/admin/warning-types');
      const types = (ensureArray(response.data, 'warning_types') as Record<string, unknown>[]).map(
        (t) => ({
          id: t.id as string,
          name: t.name as string,
          description: (t.description as string) || '',
          points: t.points as number,
          expiryDays: t.expiry_days as number,
          action: t.action as WarningType['action'],
          actionThreshold: t.action_threshold as number | undefined,
        })
      );
      set({ warningTypes: types });
    } catch (error) {
      logger.error(' Failed to fetch warning types:', error);
      throw error;
    }
  },

  // ========================================
  // MODERATION LOG
  // ========================================

  fetchModerationLog: async (filters = {}) => {
    set({ isLoadingLog: true });
    try {
      const params: Record<string, string | number> = {};
      if (filters.moderatorId) params.moderator_id = filters.moderatorId;
      if (filters.action) params.action = filters.action;
      if (filters.targetType) params.target_type = filters.targetType;
      if (filters.page) params.page = filters.page;

      const response = await api.get('/api/v1/admin/moderation/log', { params });
      const entries = (ensureArray(response.data, 'entries') as Record<string, unknown>[]).map(
        (e) => ({
          id: e.id as string,
          action: e.action as string,
          targetType: e.target_type as ModerationLogEntry['targetType'],
          targetId: e.target_id as string,
          targetTitle: e.target_title as string | undefined,
          moderatorId: e.moderator_id as string,
          moderatorUsername: e.moderator_username as string,
          reason: e.reason as string | undefined,
          details: e.details as Record<string, unknown> | undefined,
          createdAt: (e.created_at as string) || (e.inserted_at as string),
        })
      );
      set({ moderationLog: entries, isLoadingLog: false });
    } catch (error) {
      logger.error(' Failed to fetch moderation log:', error);
      set({ isLoadingLog: false });
      throw error;
    }
  },

  logModAction: async (
    action: string,
    targetType: string,
    targetId: string,
    reason?: string,
    details?: Record<string, unknown>
  ) => {
    try {
      await api.post('/api/v1/admin/moderation/log', {
        action,
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      });
    } catch (error) {
      // Don't throw - logging failures shouldn't break the main action
      logger.error(' Failed to log moderation action:', error);
    }
  },
}));

export default useModerationStore;
