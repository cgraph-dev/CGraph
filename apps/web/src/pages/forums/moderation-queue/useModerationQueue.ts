/**
 * ModerationQueue hook
 * @module pages/forums/moderation-queue
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useModerationStore } from '@/modules/moderation/store';
import type { FilterState, UseModerationQueueReturn } from './types';
import { DEFAULT_FILTER_STATE } from './constants';

export function useModerationQueue(): UseModerationQueueReturn {
  const {
    queue,
    queueCounts,
    isLoadingQueue,
    fetchModerationQueue,
    approveQueueItem,
    rejectQueueItem,
  } = useModerationStore();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch queue on mount and filter change
  useEffect(() => {
    fetchModerationQueue({
      status: filters.status,
      itemType: filters.itemType !== 'all' ? filters.itemType : undefined,
      priority: filters.priority !== 'all' ? filters.priority : undefined,
    });
  }, [filters.status, filters.itemType, filters.priority, fetchModerationQueue]);

  // Filtered items
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      if (filters.reason !== 'all' && item.reason !== filters.reason) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          item.content.toLowerCase().includes(query) ||
          item.authorUsername.toLowerCase().includes(query) ||
          (item.title?.toLowerCase().includes(query) ?? false)
        );
      }
      return true;
    });
  }, [queue, filters.reason, filters.searchQuery]);

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(filteredQueue.map((item) => item.id)));
  }, [filteredQueue]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Action handlers
  const handleApprove = useCallback(
    async (id: string) => {
      await approveQueueItem(id);
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [approveQueueItem]
  );

  const handleReject = useCallback((id: string) => {
    setRejectingItemId(id);
    setRejectModalOpen(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectingItemId) return;
    await rejectQueueItem(rejectingItemId, rejectReason);
    setRejectModalOpen(false);
    setRejectingItemId(null);
    setRejectReason('');
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(rejectingItemId);
      return next;
    });
  }, [rejectingItemId, rejectReason, rejectQueueItem]);

  const closeRejectModal = useCallback(() => {
    setRejectModalOpen(false);
    setRejectingItemId(null);
    setRejectReason('');
  }, []);

  // Bulk actions
  const handleBulkApprove = useCallback(async () => {
    for (const id of selectedItems) {
      await approveQueueItem(id);
    }
    clearSelection();
  }, [selectedItems, approveQueueItem, clearSelection]);

  const handleBulkReject = useCallback(() => {
    if (selectedItems.size > 0) {
      setRejectingItemId(Array.from(selectedItems).join(','));
      setRejectModalOpen(true);
    }
  }, [selectedItems]);

  const refresh = useCallback(() => {
    fetchModerationQueue();
  }, [fetchModerationQueue]);

  return {
    filters,
    setFilters,
    selectedItems,
    filteredQueue,
    isLoadingQueue,
    queueCounts,
    rejectModalOpen,
    rejectReason,
    setRejectReason,
    toggleSelect,
    selectAll,
    clearSelection,
    handleApprove,
    handleReject,
    handleBulkApprove,
    handleBulkReject,
    confirmReject,
    closeRejectModal,
    refresh,
  };
}
