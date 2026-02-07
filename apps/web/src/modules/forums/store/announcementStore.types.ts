/**
 * Announcement Store Types
 *
 * Type definitions for the announcement system with MyBB-style features:
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

export interface AnnouncementState {
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
