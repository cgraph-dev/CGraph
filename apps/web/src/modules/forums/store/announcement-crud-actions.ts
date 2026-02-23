/**
 * Announcement CRUD action creators.
 * @module
 */
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type {
  Announcement,
  AnnouncementFormData,
  AnnouncementState,
} from './announcementStore.types';
import { mapAnnouncementFromApi } from './announcement-mappers';

const logger = createLogger('AnnouncementStore:CRUD');

type Set = (
  partial: Partial<AnnouncementState> | ((state: AnnouncementState) => Partial<AnnouncementState>)
) => void;
type Get = () => AnnouncementState;

/**
 * Creates CRUD, visibility, and ordering actions for the announcement store.
 */
export function createCrudActions(set: Set, get: Get) {
  return {
    // ========================================
    // CRUD
    // ========================================

    createAnnouncement: async (data: AnnouncementFormData) => {
      try {
        const response = await api.post('/api/v1/announcements', {
          title: data.title,
          content: data.content,
          scope: data.scope,
          forum_id: data.forumId,
          start_date: data.startDate,
          end_date: data.endDate,
          allowed_groups: data.allowedGroups,
          priority: data.priority ?? 0,
          allow_html: data.allowHtml ?? false,
          allow_bbcode: data.allowBbcode ?? true,
          show_in_index: data.showInIndex ?? true,
          show_in_forum_view: data.showInForumView ?? true,
          icon: data.icon,
          background_color: data.backgroundColor,
          text_color: data.textColor,
        });

        const announcement = mapAnnouncementFromApi(response.data.announcement || response.data);

        const MAX_ANNOUNCEMENTS = 200;
        set((state) => ({
          announcements: [announcement, ...state.announcements].slice(0, MAX_ANNOUNCEMENTS),
        }));

        return announcement;
      } catch (error) {
        logger.error('Failed to create announcement:', error);
        throw error;
      }
    },

    updateAnnouncement: async (id: string, data: Partial<AnnouncementFormData>) => {
      try {
        const response = await api.put(`/api/v1/announcements/${id}`, {
          title: data.title,
          content: data.content,
          scope: data.scope,
          forum_id: data.forumId,
          start_date: data.startDate,
          end_date: data.endDate,
          allowed_groups: data.allowedGroups,
          priority: data.priority,
          allow_html: data.allowHtml,
          allow_bbcode: data.allowBbcode,
          show_in_index: data.showInIndex,
          show_in_forum_view: data.showInForumView,
          icon: data.icon,
          background_color: data.backgroundColor,
          text_color: data.textColor,
        });

        const updated = mapAnnouncementFromApi(response.data.announcement || response.data);

        set((state) => ({
          announcements: state.announcements.map((a) => (a.id === id ? updated : a)),
          currentAnnouncement:
            state.currentAnnouncement?.id === id ? updated : state.currentAnnouncement,
        }));
      } catch (error) {
        logger.error('Failed to update announcement:', error);
        throw error;
      }
    },

    deleteAnnouncement: async (id: string) => {
      try {
        await api.delete(`/api/v1/announcements/${id}`);

        set((state) => ({
          announcements: state.announcements.filter((a) => a.id !== id),
          globalAnnouncements: state.globalAnnouncements.filter((a) => a.id !== id),
          currentAnnouncement:
            state.currentAnnouncement?.id === id ? null : state.currentAnnouncement,
        }));
      } catch (error) {
        logger.error('Failed to delete announcement:', error);
        throw error;
      }
    },

    // ========================================
    // VISIBILITY
    // ========================================

    activateAnnouncement: async (id: string) => {
      try {
        await api.post(`/api/v1/announcements/${id}/activate`);

        set((state) => ({
          announcements: state.announcements.map((a) =>
            a.id === id ? { ...a, isActive: true } : a
          ),
        }));
      } catch (error) {
        logger.error('Failed to activate announcement:', error);
        throw error;
      }
    },

    deactivateAnnouncement: async (id: string) => {
      try {
        await api.post(`/api/v1/announcements/${id}/deactivate`);

        set((state) => ({
          announcements: state.announcements.map((a) =>
            a.id === id ? { ...a, isActive: false } : a
          ),
          globalAnnouncements: state.globalAnnouncements.filter((a) => a.id !== id),
        }));
      } catch (error) {
        logger.error('Failed to deactivate announcement:', error);
        throw error;
      }
    },

    // ========================================
    // ORDERING
    // ========================================

    reorderAnnouncements: async (announcementIds: string[]) => {
      try {
        await api.post('/api/v1/announcements/reorder', {
          announcement_ids: announcementIds,
        });

        // Update local order
        const { announcements } = get();
        const reordered = announcementIds
          .map((id, index) => {
            const announcement = announcements.find((a) => a.id === id);
            return announcement
              ? { ...announcement, priority: announcementIds.length - index }
              : null;
          })
          .filter((a): a is Announcement => a !== null);

        set({ announcements: reordered });
      } catch (error) {
        logger.error('Failed to reorder announcements:', error);
        throw error;
      }
    },

    updatePriority: async (id: string, priority: number) => {
      try {
        await api.put(`/api/v1/announcements/${id}`, { priority });

        set((state) => ({
          announcements: state.announcements.map((a) => (a.id === id ? { ...a, priority } : a)),
        }));
      } catch (error) {
        logger.error('Failed to update priority:', error);
        throw error;
      }
    },
  };
}
