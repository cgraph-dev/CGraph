/**
 * Thread & Post Moderation Action Hooks
 *
 * Hooks for individual thread and post moderation actions.
 *
 * @module modules/moderation/hooks/useModeration-actions
 */

import { useCallback } from 'react';
import { useModerationStore } from '../store';

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
