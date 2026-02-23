/**
 * Admin Moderation Actions
 *
 * Moderation queue fetch, filter, review, and assign actions.
 *
 * @module modules/admin/store/admin-moderation-actions
 */

import type { AdminStore, ModerationItem, ModerationStatus } from './adminStore.types';
import { MOCK_MODERATION_QUEUE } from './adminStore.mockData';

type Set = (
  partial: Partial<AdminStore> | ((state: AdminStore) => Partial<AdminStore>),
  replace?: false
) => void;

export function createModerationActions(set: Set) {
  return {
    fetchModerationQueue: async () => {
      set({ isLoading: true, error: null });
      try {
        const { api } = await import('@/lib/api');
        const response = await api.get('/api/v1/admin/moderation');
        set({
          moderationQueue: (response.data as ModerationItem[]).map((item) => ({ // type assertion: API response data shape
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })),
          isLoading: false,
        });
      } catch {
        // Use mock data for development
        set({
          moderationQueue: MOCK_MODERATION_QUEUE,
          isLoading: false,
        });
      }
    },

    setModerationFilters: (filters: Parameters<AdminStore['setModerationFilters']>[0]) =>
      set((state) => ({
        moderationFilters: { ...state.moderationFilters, ...filters },
      })),

    reviewModerationItem: async (
      id: string,
      action: 'approve' | 'reject' | 'escalate',
      notes?: string
    ) => {
      set({ isLoading: true });
      try {
        const { api } = await import('@/lib/api');
        await api.post(`/api/v1/admin/moderation/${id}/review`, { action, notes });

        const newStatus: ModerationStatus =
          action === 'approve' ? 'resolved' : action === 'reject' ? 'dismissed' : 'escalated';

        set((state) => ({
          moderationQueue: state.moderationQueue.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: newStatus,
                  updatedAt: new Date(),
                  notes: notes ? [...item.notes, notes] : item.notes,
                }
              : item
          ),
          isLoading: false,
        }));
      } catch {
        set({ isLoading: false, error: 'Failed to review moderation item' });
      }
    },

    assignModerationItem: async (id: string, assigneeId: string) => {
      try {
        const { api } = await import('@/lib/api');
        await api.post(`/api/v1/admin/moderation/${id}/assign`, { assignee_id: assigneeId });
        set((state) => ({
          moderationQueue: state.moderationQueue.map((item) =>
            item.id === id ? { ...item, assignedTo: assigneeId } : item
          ),
        }));
      } catch {
        set({ error: 'Failed to assign moderation item' });
      }
    },
  };
}
