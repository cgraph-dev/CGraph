/**
 * Inline / Bulk Moderation Hook
 *
 * Hook for bulk selection and bulk moderation actions.
 *
 * @module modules/moderation/hooks/useModeration-bulk
 */

import { useCallback } from 'react';
import { useModerationStore } from '../store';

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
