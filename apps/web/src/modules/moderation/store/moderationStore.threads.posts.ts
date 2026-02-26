/**
 * Moderation Store — Post Moderation Actions
 * @module modules/moderation/store
 *
 * Individual post moderation operations (move, delete, restore, approve, unapprove).
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

const logger = createLogger('ModerationStore:Posts');

/**
 * unknown for the moderation module.
 */
/**
 * Creates a new post actions.
 *
 * @param _set - The _set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createPostActions(_set: Set, get: Get) {
  return {
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
  };
}
