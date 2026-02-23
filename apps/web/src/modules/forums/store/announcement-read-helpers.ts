/**
 * Announcement read status helper utilities.
 * @module
 */
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { AnnouncementState } from './announcementStore.types';

const logger = createLogger('AnnouncementStore:ReadHelpers');

type Set = (
  partial: Partial<AnnouncementState> | ((state: AnnouncementState) => Partial<AnnouncementState>)
) => void;
type Get = () => AnnouncementState;

/**
 * Creates read-tracking, helper, and clear actions for the announcement store.
 */
export function createReadAndHelperActions(set: Set, get: Get) {
  return {
    // ========================================
    // READ TRACKING
    // ========================================

    markAsRead: async (id: string) => {
      const { readAnnouncementIds } = get();
      if (readAnnouncementIds.has(id)) return;

      try {
        await api.post(`/api/v1/announcements/${id}/read`);

        set((state) => {
          const updated = new Set(state.readAnnouncementIds);
          updated.add(id);
          return {
            readAnnouncementIds: updated,
            globalAnnouncements: state.globalAnnouncements.map((a) =>
              a.id === id ? { ...a, isRead: true, readAt: new Date().toISOString() } : a
            ),
          };
        });
      } catch (error) {
        logger.error('Failed to mark as read:', error);
      }
    },

    markAllAsRead: async () => {
      try {
        await api.post('/api/v1/announcements/read-all');

        const allIds = [
          ...get().globalAnnouncements.map((a) => a.id),
          ...Array.from(get().forumAnnouncements.values())
            .flat()
            .map((a) => a.id),
        ];

        set((state) => {
          const updated = new Set(state.readAnnouncementIds);
          allIds.forEach((id) => updated.add(id));
          return {
            readAnnouncementIds: updated,
            globalAnnouncements: state.globalAnnouncements.map((a) => ({
              ...a,
              isRead: true,
              readAt: new Date().toISOString(),
            })),
          };
        });
      } catch (error) {
        logger.error('Failed to mark all as read:', error);
      }
    },

    isAnnouncementRead: (id: string) => {
      return get().readAnnouncementIds.has(id);
    },

    // ========================================
    // HELPERS
    // ========================================

    getActiveAnnouncements: (forumId?: string) => {
      const { globalAnnouncements, forumAnnouncements } = get();
      const now = new Date();

      let announcements = [...globalAnnouncements];

      if (forumId) {
        const forumSpecific = forumAnnouncements.get(forumId) || [];
        announcements = [...announcements, ...forumSpecific];
      }

      return announcements
        .filter((a) => {
          if (!a.isActive) return false;
          const start = new Date(a.startDate);
          if (start > now) return false;
          if (a.endDate && new Date(a.endDate) < now) return false;
          return true;
        })
        .sort((a, b) => b.priority - a.priority);
    },

    getUnreadCount: (forumId?: string) => {
      const active = get().getActiveAnnouncements(forumId);
      const { readAnnouncementIds } = get();
      return active.filter((a) => !readAnnouncementIds.has(a.id) && !a.isRead).length;
    },

    clearState: () => {
      set({
        announcements: [],
        globalAnnouncements: [],
        forumAnnouncements: new Map(),
        currentAnnouncement: null,
        readAnnouncementIds: new Set(),
        page: 1,
        totalPages: 1,
        totalCount: 0,
      });
    },
  };
}
