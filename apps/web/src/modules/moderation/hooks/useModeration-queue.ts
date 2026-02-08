/**
 * Moderation Queue & Data Hooks
 *
 * Hooks for moderation queue, user warnings, ban management, and moderation log.
 *
 * @module modules/moderation/hooks/useModeration-queue
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
