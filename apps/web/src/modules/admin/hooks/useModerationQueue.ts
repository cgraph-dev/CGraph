/**
 * Moderation Queue Hook
 *
 * Hook for admin moderation queue management.
 *
 * @module modules/admin/hooks/useModerationQueue
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAdminStore } from '../store';
import type { ModerationStatus, RiskLevel } from '../store';

/**
 * Hook for moderation queue management
 */
export function useModerationQueue() {
  const {
    moderationQueue,
    moderationFilters,
    isLoading,
    error,
    fetchModerationQueue,
    setModerationFilters,
    reviewModerationItem,
    assignModerationItem,
  } = useAdminStore();

  // Fetch queue on mount
  useEffect(() => {
    if (moderationQueue.length === 0) {
      fetchModerationQueue();
    }
  }, [moderationQueue.length, fetchModerationQueue]);

  // Filter queue based on current filters
  const filteredQueue = useMemo(() => {
    return moderationQueue.filter((item) => {
      if (moderationFilters.status !== 'all' && item.status !== moderationFilters.status) {
        return false;
      }
      if (moderationFilters.riskLevel !== 'all' && item.riskLevel !== moderationFilters.riskLevel) {
        return false;
      }
      if (moderationFilters.type !== 'all' && item.type !== moderationFilters.type) {
        return false;
      }
      return true;
    });
  }, [moderationQueue, moderationFilters]);

  // Queue stats
  const queueStats = useMemo(
    () => ({
      total: moderationQueue.length,
      pending: moderationQueue.filter((i) => i.status === 'pending').length,
      critical: moderationQueue.filter((i) => i.riskLevel === 'critical').length,
      escalated: moderationQueue.filter((i) => i.status === 'escalated').length,
    }),
    [moderationQueue]
  );

  const filterByStatus = useCallback(
    (status: ModerationStatus | 'all') => {
      setModerationFilters({ status });
    },
    [setModerationFilters]
  );

  const filterByRisk = useCallback(
    (riskLevel: RiskLevel | 'all') => {
      setModerationFilters({ riskLevel });
    },
    [setModerationFilters]
  );

  const approveItem = useCallback(
    async (id: string, notes?: string) => {
      await reviewModerationItem(id, 'approve', notes);
    },
    [reviewModerationItem]
  );

  const rejectItem = useCallback(
    async (id: string, notes?: string) => {
      await reviewModerationItem(id, 'reject', notes);
    },
    [reviewModerationItem]
  );

  const escalateItem = useCallback(
    async (id: string, notes?: string) => {
      await reviewModerationItem(id, 'escalate', notes);
    },
    [reviewModerationItem]
  );

  return {
    queue: filteredQueue,
    allItems: moderationQueue,
    filters: moderationFilters,
    stats: queueStats,
    isLoading,
    error,
    refresh: fetchModerationQueue,
    filterByStatus,
    filterByRisk,
    setFilters: setModerationFilters,
    approveItem,
    rejectItem,
    escalateItem,
    assignItem: assignModerationItem,
  };
}
