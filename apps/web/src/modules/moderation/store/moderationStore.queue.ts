/**
 * Moderation Store — Queue Actions
 * @module modules/moderation/store
 *
 * Moderation queue management: fetch, approve, reject.
 */

import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import type { ModerationQueueItem, ModerationState } from './moderationStore.types';

type Set = (
  partial:
    | Partial<ModerationState>
    | ModerationState
    | ((state: ModerationState) => Partial<ModerationState> | ModerationState)
) => void;

const logger = createLogger('ModerationStore:Queue');

export function createQueueActions(set: Set) {
  return {
    fetchModerationQueue: async (
      filters: { status?: string; itemType?: string; priority?: string } = {}
    ) => {
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
  };
}
