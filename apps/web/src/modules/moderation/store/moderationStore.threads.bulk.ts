/**
 * Moderation Store — Bulk (Inline) Moderation Actions
 * @module modules/moderation/store
 *
 * Bulk selection and bulk thread operations (move, delete, lock, approve).
 */

import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { ModerationState } from './moderationStore.types';

type Set = (
  partial:
    | Partial<ModerationState>
    | ModerationState
    | ((state: ModerationState) => Partial<ModerationState> | ModerationState)
) => void;
type Get = () => ModerationState;

const logger = createLogger('ModerationStore:Bulk');

/**
 * unknown for the moderation module.
 */
/**
 * Creates a new bulk actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createBulkActions(set: Set, get: Get) {
  return {
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
  };
}
