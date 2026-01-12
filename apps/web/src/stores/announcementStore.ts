import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';

/**
 * Announcement System Store
 * 
 * Complete announcement system with MyBB-style features:
 * - Global and forum-specific announcements
 * - Date-based visibility (start/end dates)
 * - User group targeting
 * - HTML/BBCode support
 * - Read tracking
 * - Ordering and priority
 */

// Announcement visibility scope
export type AnnouncementScope = 'global' | 'forum' | 'category';

// Announcement
export interface Announcement {
  id: string;
  title: string;
  content: string; // HTML/BBCode
  
  // Scope
  scope: AnnouncementScope;
  forumId: string | null; // If scope is 'forum' or category
  forumName?: string;
  
  // Author
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  
  // Visibility
  isActive: boolean;
  startDate: string;
  endDate: string | null; // Null = no end date
  
  // Targeting
  allowedGroups: string[]; // Empty = all groups
  allowedGroupNames?: string[];
  
  // Display options
  priority: number; // Higher = shows first
  allowHtml: boolean;
  allowBbcode: boolean;
  showInIndex: boolean; // Show on forum index
  showInForumView: boolean;
  
  // Icon and styling
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  
  // Stats
  viewCount: number;
  
  // Read tracking (per user)
  isRead?: boolean;
  readAt?: string | null;
  
  // Dates
  createdAt: string;
  updatedAt: string;
}

// Create/Edit announcement data
export interface AnnouncementFormData {
  title: string;
  content: string;
  scope: AnnouncementScope;
  forumId?: string | null;
  startDate: string;
  endDate?: string | null;
  allowedGroups?: string[];
  priority?: number;
  allowHtml?: boolean;
  allowBbcode?: boolean;
  showInIndex?: boolean;
  showInForumView?: boolean;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
}

// Filters for fetching announcements
export interface AnnouncementFilters {
  scope?: AnnouncementScope;
  forumId?: string;
  isActive?: boolean;
  includeExpired?: boolean;
  authorId?: string;
  groupId?: string;
}

interface AnnouncementState {
  // All announcements (admin view)
  announcements: Announcement[];
  
  // Active announcements for display
  globalAnnouncements: Announcement[];
  forumAnnouncements: Map<string, Announcement[]>; // forumId -> announcements
  
  // Current announcement being viewed/edited
  currentAnnouncement: Announcement | null;
  
  // Loading
  isLoading: boolean;
  
  // Read tracking
  readAnnouncementIds: Set<string>;
  
  // Pagination
  page: number;
  totalPages: number;
  totalCount: number;
  
  // Actions - Fetch
  fetchAnnouncements: (filters?: AnnouncementFilters) => Promise<void>;
  fetchGlobalAnnouncements: () => Promise<void>;
  fetchForumAnnouncements: (forumId: string) => Promise<void>;
  fetchAnnouncement: (id: string) => Promise<Announcement | null>;
  
  // Actions - CRUD
  createAnnouncement: (data: AnnouncementFormData) => Promise<Announcement>;
  updateAnnouncement: (id: string, data: Partial<AnnouncementFormData>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  
  // Actions - Visibility
  activateAnnouncement: (id: string) => Promise<void>;
  deactivateAnnouncement: (id: string) => Promise<void>;
  
  // Actions - Read tracking
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isAnnouncementRead: (id: string) => boolean;
  
  // Actions - Ordering
  reorderAnnouncements: (announcementIds: string[]) => Promise<void>;
  updatePriority: (id: string, priority: number) => Promise<void>;
  
  // Actions - Helpers
  getActiveAnnouncements: (forumId?: string) => Announcement[];
  getUnreadCount: (forumId?: string) => number;
  
  // Clear
  clearState: () => void;
}

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

  // ========================================
  // FETCH
  // ========================================

  fetchAnnouncements: async (filters?: AnnouncementFilters) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/api/v1/announcements', {
        params: {
          scope: filters?.scope,
          forum_id: filters?.forumId,
          is_active: filters?.isActive,
          include_expired: filters?.includeExpired,
          author_id: filters?.authorId,
          group_id: filters?.groupId,
        },
      });
      
      const data = response.data;
      const announcements = (ensureArray(data, 'announcements') as Record<string, unknown>[]).map(mapAnnouncementFromApi);
      
      set({
        announcements,
        page: (data.page as number) || 1,
        totalPages: (data.total_pages as number) || 1,
        totalCount: (data.total_count as number) || announcements.length,
        isLoading: false,
      });
    } catch (error) {
      console.error('[announcementStore] Failed to fetch announcements:', error);
      set({ isLoading: false });
    }
  },

  fetchGlobalAnnouncements: async () => {
    try {
      const response = await api.get('/api/v1/announcements/global');
      const announcements = (ensureArray(response.data, 'announcements') as Record<string, unknown>[]).map(mapAnnouncementFromApi);
      
      // Filter only active ones
      const now = new Date();
      const active = announcements.filter((a) => {
        if (!a.isActive) return false;
        const start = new Date(a.startDate);
        if (start > now) return false;
        if (a.endDate && new Date(a.endDate) < now) return false;
        return true;
      });
      
      set({ globalAnnouncements: active });
    } catch (error) {
      console.error('[announcementStore] Failed to fetch global announcements:', error);
    }
  },

  fetchForumAnnouncements: async (forumId: string) => {
    try {
      const response = await api.get(`/api/v1/forums/${forumId}/announcements`);
      const announcements = (ensureArray(response.data, 'announcements') as Record<string, unknown>[]).map(mapAnnouncementFromApi);
      
      // Filter only active ones
      const now = new Date();
      const active = announcements.filter((a) => {
        if (!a.isActive) return false;
        const start = new Date(a.startDate);
        if (start > now) return false;
        if (a.endDate && new Date(a.endDate) < now) return false;
        return true;
      });
      
      set((state) => {
        const updated = new Map(state.forumAnnouncements);
        updated.set(forumId, active);
        return { forumAnnouncements: updated };
      });
    } catch (error) {
      console.error('[announcementStore] Failed to fetch forum announcements:', error);
    }
  },

  fetchAnnouncement: async (id: string) => {
    try {
      const response = await api.get(`/api/v1/announcements/${id}`);
      const announcement = mapAnnouncementFromApi(response.data.announcement || response.data);
      set({ currentAnnouncement: announcement });
      return announcement;
    } catch (error) {
      console.error('[announcementStore] Failed to fetch announcement:', error);
      return null;
    }
  },

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
      
      set((state) => ({
        announcements: [announcement, ...state.announcements],
      }));
      
      return announcement;
    } catch (error) {
      console.error('[announcementStore] Failed to create announcement:', error);
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
        currentAnnouncement: state.currentAnnouncement?.id === id ? updated : state.currentAnnouncement,
      }));
    } catch (error) {
      console.error('[announcementStore] Failed to update announcement:', error);
      throw error;
    }
  },

  deleteAnnouncement: async (id: string) => {
    try {
      await api.delete(`/api/v1/announcements/${id}`);
      
      set((state) => ({
        announcements: state.announcements.filter((a) => a.id !== id),
        globalAnnouncements: state.globalAnnouncements.filter((a) => a.id !== id),
        currentAnnouncement: state.currentAnnouncement?.id === id ? null : state.currentAnnouncement,
      }));
    } catch (error) {
      console.error('[announcementStore] Failed to delete announcement:', error);
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
      console.error('[announcementStore] Failed to activate announcement:', error);
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
      console.error('[announcementStore] Failed to deactivate announcement:', error);
      throw error;
    }
  },

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
      console.error('[announcementStore] Failed to mark as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/api/v1/announcements/read-all');
      
      const allIds = [
        ...get().globalAnnouncements.map((a) => a.id),
        ...Array.from(get().forumAnnouncements.values()).flat().map((a) => a.id),
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
      console.error('[announcementStore] Failed to mark all as read:', error);
    }
  },

  isAnnouncementRead: (id: string) => {
    return get().readAnnouncementIds.has(id);
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
          return announcement ? { ...announcement, priority: announcementIds.length - index } : null;
        })
        .filter((a): a is Announcement => a !== null);
      
      set({ announcements: reordered });
    } catch (error) {
      console.error('[announcementStore] Failed to reorder announcements:', error);
      throw error;
    }
  },

  updatePriority: async (id: string, priority: number) => {
    try {
      await api.put(`/api/v1/announcements/${id}`, { priority });
      
      set((state) => ({
        announcements: state.announcements.map((a) =>
          a.id === id ? { ...a, priority } : a
        ),
      }));
    } catch (error) {
      console.error('[announcementStore] Failed to update priority:', error);
      throw error;
    }
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
}));

// ========================================
// API MAPPING HELPERS
// ========================================

function mapAnnouncementFromApi(data: Record<string, unknown>): Announcement {
  const author = (data.author as Record<string, unknown>) || {};
  
  return {
    id: data.id as string,
    title: (data.title as string) || 'Untitled',
    content: (data.content as string) || '',
    
    scope: (data.scope as AnnouncementScope) || 'global',
    forumId: (data.forum_id as string) || null,
    forumName: data.forum_name as string | undefined,
    
    authorId: (data.author_id as string) || (author.id as string) || '',
    authorUsername: (data.author_username as string) || (author.username as string) || 'Unknown',
    authorDisplayName: (data.author_display_name as string) || (author.display_name as string) || null,
    authorAvatarUrl: (data.author_avatar_url as string) || (author.avatar_url as string) || null,
    
    isActive: data.is_active !== false,
    startDate: (data.start_date as string) || new Date().toISOString(),
    endDate: (data.end_date as string) || null,
    
    allowedGroups: (data.allowed_groups as string[]) || [],
    allowedGroupNames: data.allowed_group_names as string[] | undefined,
    
    priority: (data.priority as number) || 0,
    allowHtml: (data.allow_html as boolean) || false,
    allowBbcode: data.allow_bbcode !== false,
    showInIndex: data.show_in_index !== false,
    showInForumView: data.show_in_forum_view !== false,
    
    icon: data.icon as string | undefined,
    backgroundColor: data.background_color as string | undefined,
    textColor: data.text_color as string | undefined,
    
    viewCount: (data.view_count as number) || 0,
    
    isRead: data.is_read as boolean | undefined,
    readAt: (data.read_at as string) || null,
    
    createdAt: (data.created_at as string) || new Date().toISOString(),
    updatedAt: (data.updated_at as string) || (data.created_at as string) || new Date().toISOString(),
  };
}
