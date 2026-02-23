/**
 * Announcement store implementation.
 * @module
 */
import { create } from 'zustand';
import type { AnnouncementState } from './announcementStore.types';
import { createFetchActions } from './announcement-fetch-actions';
import { createCrudActions } from './announcement-crud-actions';
import { createReadAndHelperActions } from './announcement-read-helpers';

// Re-export types
export type {
  AnnouncementScope,
  Announcement,
  AnnouncementFormData,
  AnnouncementFilters,
  AnnouncementState,
} from './announcementStore.types';

// Re-export mapper for external use
export { mapAnnouncementFromApi } from './announcement-mappers';

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  // Initial state
  announcements: [],
  globalAnnouncements: [],
  forumAnnouncements: new Map(),
  currentAnnouncement: null,
  isLoading: false,
  readAnnouncementIds: new Set(),
  page: 1,
  totalPages: 1,
  totalCount: 0,

  // Compose actions from submodules
  ...createFetchActions(set),
  ...createCrudActions(set, get),
  ...createReadAndHelperActions(set, get),

  reset: () =>
    set({
      announcements: [],
      globalAnnouncements: [],
      forumAnnouncements: new Map(),
      currentAnnouncement: null,
      isLoading: false,
      readAnnouncementIds: new Set(),
      page: 1,
      totalPages: 1,
      totalCount: 0,
    }),
}));
