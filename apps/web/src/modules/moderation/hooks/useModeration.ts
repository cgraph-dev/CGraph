/**
 * Moderation Hooks
 *
 * Custom React hooks for moderation functionality.
 * These hooks provide a convenient interface to the moderation store.
 *
 * @module modules/moderation/hooks
 * @version 1.0.0
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useModerationStore } from '../store';
import type { ModerationQueueItem, UserWarning, Ban, ModerationLogEntry } from '../store';

/**
 * Hook for moderation queue management
 */
export function useModerationQueue() {
  const {
    queue,
    queueCounts,
    isLoadingQueue,
    fetchModerationQueue,
    approveQueueItem,
    rejectQueueItem,
  } = useModerationStore();

  // Fetch queue on mount
  useEffect(() => {
    if (queue.length === 0) {
      fetchModerationQueue();
    }
  }, [queue.length, fetchModerationQueue]);

  const pendingCount = useMemo(() => queueCounts.pending, [queueCounts.pending]);

  const criticalCount = useMemo(
    () => queue.filter((item) => item.priority === 'critical').length,
    [queue]
  );

  const filterByStatus = useCallback(
    (status: 'pending' | 'all') => {
      fetchModerationQueue({ status });
    },
    [fetchModerationQueue]
  );

  const filterByType = useCallback(
    (itemType: ModerationQueueItem['itemType'] | undefined) => {
      fetchModerationQueue({ itemType });
    },
    [fetchModerationQueue]
  );

  const filterByPriority = useCallback(
    (priority: ModerationQueueItem['priority'] | undefined) => {
      fetchModerationQueue({ priority });
    },
    [fetchModerationQueue]
  );

  const approve = useCallback(
    async (id: string, notes?: string) => {
      await approveQueueItem(id, notes);
    },
    [approveQueueItem]
  );

  const reject = useCallback(
    async (id: string, reason: string, notes?: string) => {
      await rejectQueueItem(id, reason, notes);
    },
    [rejectQueueItem]
  );

  return {
    queue,
    queueCounts,
    isLoading: isLoadingQueue,
    pendingCount,
    criticalCount,
    refresh: fetchModerationQueue,
    filterByStatus,
    filterByType,
    filterByPriority,
    approve,
    reject,
  };
}

/**
 * Hook for user warnings management
 */
export function useUserWarnings(userId?: string) {
  const {
    currentUserWarnings,
    currentUserStats,
    warningTypes,
    fetchUserWarnings,
    fetchWarningTypes,
    issueWarning,
    revokeWarning,
  } = useModerationStore();

  // Fetch warnings for user
  useEffect(() => {
    if (userId) {
      fetchUserWarnings(userId);
    }
    if (warningTypes.length === 0) {
      fetchWarningTypes();
    }
  }, [userId, warningTypes.length, fetchUserWarnings, fetchWarningTypes]);

  const activeWarnings = useMemo(
    () => currentUserWarnings.filter((w: UserWarning) => w.isActive && !w.isRevoked),
    [currentUserWarnings]
  );

  const totalPoints = useMemo(
    () => activeWarnings.reduce((sum: number, w: UserWarning) => sum + w.points, 0),
    [activeWarnings]
  );

  const issue = useCallback(
    async (targetUserId: string, warningTypeId: string, reason: string, notes?: string) => {
      return await issueWarning(targetUserId, warningTypeId, reason, notes);
    },
    [issueWarning]
  );

  const revoke = useCallback(
    async (warningId: string, reason: string) => {
      await revokeWarning(warningId, reason);
    },
    [revokeWarning]
  );

  return {
    warnings: currentUserWarnings,
    activeWarnings,
    warningTypes,
    totalPoints,
    userStats: currentUserStats,
    refresh: () => userId && fetchUserWarnings(userId),
    issue,
    revoke,
  };
}

/**
 * Hook for ban management
 */
export function useBanManagement() {
  const { bans, isLoadingBans, fetchBans, banUser, liftBan } = useModerationStore();

  // Fetch bans on mount
  useEffect(() => {
    if (bans.length === 0) {
      fetchBans();
    }
  }, [bans.length, fetchBans]);

  const activeBans = useMemo(() => bans.filter((b: Ban) => b.isActive && !b.isLifted), [bans]);

  const permanentBans = useMemo(
    () => activeBans.filter((b: Ban) => b.expiresAt === null),
    [activeBans]
  );

  const temporaryBans = useMemo(
    () => activeBans.filter((b: Ban) => b.expiresAt !== null),
    [activeBans]
  );

  const ban = useCallback(
    async (data: {
      userId?: string;
      username?: string;
      email?: string;
      ipAddress?: string;
      reason: string;
      expiresAt?: string | null;
      notes?: string;
    }) => {
      return await banUser(data);
    },
    [banUser]
  );

  const lift = useCallback(
    async (banId: string, reason: string) => {
      await liftBan(banId, reason);
    },
    [liftBan]
  );

  return {
    bans,
    activeBans,
    permanentBans,
    temporaryBans,
    isLoading: isLoadingBans,
    refresh: fetchBans,
    ban,
    lift,
  };
}

/**
 * Hook for moderation log
 */
export function useModerationLog(filters?: {
  moderatorId?: string;
  action?: string;
  targetType?: string;
  page?: number;
}) {
  const { moderationLog, isLoadingLog, fetchModerationLog } = useModerationStore();

  // Fetch log on mount or filter change
  useEffect(() => {
    fetchModerationLog(filters);
  }, [
    fetchModerationLog,
    filters?.moderatorId,
    filters?.action,
    filters?.targetType,
    filters?.page,
  ]);

  const logByAction = useMemo(() => {
    const map: Record<string, ModerationLogEntry[]> = {};
    moderationLog.forEach((entry: ModerationLogEntry) => {
      if (!map[entry.action]) {
        map[entry.action] = [];
      }
      map[entry.action]!.push(entry);
    });
    return map;
  }, [moderationLog]);

  const logByModerator = useMemo(() => {
    const map: Record<string, ModerationLogEntry[]> = {};
    moderationLog.forEach((entry: ModerationLogEntry) => {
      if (!map[entry.moderatorId]) {
        map[entry.moderatorId] = [];
      }
      map[entry.moderatorId]!.push(entry);
    });
    return map;
  }, [moderationLog]);

  return {
    log: moderationLog,
    logByAction,
    logByModerator,
    isLoading: isLoadingLog,
    refresh: () => fetchModerationLog(filters),
  };
}

/**
 * Hook for thread moderation actions
 */
export function useThreadModeration() {
  const {
    closeThread,
    reopenThread,
    softDeleteThread,
    restoreThread,
    moveThread,
    splitThread,
    mergeThreads,
    copyThread,
    approveThread,
    unapproveThread,
  } = useModerationStore();

  const lock = useCallback(
    async (threadId: string, reason?: string) => {
      await closeThread(threadId, reason);
    },
    [closeThread]
  );

  const unlock = useCallback(
    async (threadId: string) => {
      await reopenThread(threadId);
    },
    [reopenThread]
  );

  const move = useCallback(
    async (threadId: string, targetForumId: string, leaveRedirect?: boolean) => {
      return await moveThread(threadId, targetForumId, leaveRedirect);
    },
    [moveThread]
  );

  const remove = useCallback(
    async (threadId: string, reason?: string) => {
      await softDeleteThread(threadId, reason);
    },
    [softDeleteThread]
  );

  const restore = useCallback(
    async (threadId: string) => {
      await restoreThread(threadId);
    },
    [restoreThread]
  );

  const split = useCallback(
    async (threadId: string, postIds: string[], newTitle: string, targetForumId?: string) => {
      return await splitThread(threadId, postIds, newTitle, targetForumId);
    },
    [splitThread]
  );

  const merge = useCallback(
    async (sourceThreadId: string, targetThreadId: string, mergePolls?: boolean) => {
      return await mergeThreads(sourceThreadId, targetThreadId, mergePolls);
    },
    [mergeThreads]
  );

  const copy = useCallback(
    async (threadId: string, targetForumId: string) => {
      return await copyThread(threadId, targetForumId);
    },
    [copyThread]
  );

  const approve = useCallback(
    async (threadId: string) => {
      await approveThread(threadId);
    },
    [approveThread]
  );

  const unapprove = useCallback(
    async (threadId: string) => {
      await unapproveThread(threadId);
    },
    [unapproveThread]
  );

  return {
    lock,
    unlock,
    move,
    delete: remove,
    restore,
    split,
    merge,
    copy,
    approve,
    unapprove,
  };
}

/**
 * Hook for post moderation actions
 */
export function usePostModeration() {
  const { approvePost, unapprovePost, softDeletePost, restorePost, movePost } =
    useModerationStore();

  const approve = useCallback(
    async (postId: string) => {
      await approvePost(postId);
    },
    [approvePost]
  );

  const unapprove = useCallback(
    async (postId: string) => {
      await unapprovePost(postId);
    },
    [unapprovePost]
  );

  const remove = useCallback(
    async (postId: string, reason?: string) => {
      await softDeletePost(postId, reason);
    },
    [softDeletePost]
  );

  const restore = useCallback(
    async (postId: string) => {
      await restorePost(postId);
    },
    [restorePost]
  );

  const move = useCallback(
    async (postId: string, targetThreadId: string) => {
      await movePost(postId, targetThreadId);
    },
    [movePost]
  );

  return {
    approve,
    unapprove,
    delete: remove,
    restore,
    move,
  };
}

/**
 * Hook for inline moderation (bulk selection)
 */
export function useInlineModeration() {
  const {
    bulkSelection,
    toggleBulkSelection,
    clearBulkSelection,
    bulkMoveThreads,
    bulkDeleteThreads,
    bulkLockThreads,
    bulkApproveThreads,
  } = useModerationStore();

  const isSelected = useCallback(
    (type: 'threads' | 'posts' | 'comments', itemId: string) => {
      return bulkSelection[type].includes(itemId);
    },
    [bulkSelection]
  );

  const toggle = useCallback(
    (type: 'threads' | 'posts' | 'comments', itemId: string) => {
      toggleBulkSelection(type, itemId);
    },
    [toggleBulkSelection]
  );

  const clear = useCallback(() => {
    clearBulkSelection();
  }, [clearBulkSelection]);

  const moveSelectedThreads = useCallback(
    async (targetForumId: string) => {
      await bulkMoveThreads(targetForumId);
    },
    [bulkMoveThreads]
  );

  const deleteSelectedThreads = useCallback(
    async (reason?: string) => {
      await bulkDeleteThreads(reason);
    },
    [bulkDeleteThreads]
  );

  const lockSelectedThreads = useCallback(async () => {
    await bulkLockThreads();
  }, [bulkLockThreads]);

  const approveSelectedThreads = useCallback(async () => {
    await bulkApproveThreads();
  }, [bulkApproveThreads]);

  return {
    selection: bulkSelection,
    selectedThreadCount: bulkSelection.threads.length,
    selectedPostCount: bulkSelection.posts.length,
    selectedCommentCount: bulkSelection.comments.length,
    hasSelection:
      bulkSelection.threads.length > 0 ||
      bulkSelection.posts.length > 0 ||
      bulkSelection.comments.length > 0,
    isSelected,
    toggle,
    clear,
    moveSelectedThreads,
    deleteSelectedThreads,
    lockSelectedThreads,
    approveSelectedThreads,
  };
}
