/**
 * Moderation Store — Thread & Post Actions (Orchestrator)
 * @module modules/moderation/store
 *
 * Re-exports combined thread, post, and bulk moderation actions.
 * Implementation split across:
 *   - moderationStore.threads.posts.ts  (post moderation)
 *   - moderationStore.threads.bulk.ts   (bulk / inline moderation)
 */

import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { ModerationState } from './moderationStore.types';
import { createPostActions } from './moderationStore.threads.posts';
import { createBulkActions } from './moderationStore.threads.bulk';

type Set = (
  partial:
    | Partial<ModerationState>
    | ModerationState
    | ((state: ModerationState) => Partial<ModerationState> | ModerationState)
) => void;
type Get = () => ModerationState;

const logger = createLogger('ModerationStore:Threads');

/**
 * unknown for the moderation module.
 */
/**
 * Creates a new thread actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createThreadActions(set: Set, get: Get) {
  return {
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

    // Post & Bulk actions (delegated to submodules)
    ...createPostActions(set, get),
    ...createBulkActions(set, get),
  };
}
