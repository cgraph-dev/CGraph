import { create } from 'zustand';
import { createLogger } from '@/lib/logger';
const logger = createLogger('calendarStore');
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';

/**
 * Calendar/Events Store
 *
 * Complete MyBB-style calendar system with:
 * - Events (single and multi-day)
 * - Categories for organization
 * - RSVP functionality
 * - Recurring events
 * - Privacy controls
 * - Event notifications
 */

// Event types
export type EventType = 'single' | 'ranged' | 'recurring' | 'birthday' | 'holiday';
export type EventVisibility = 'public' | 'members' | 'private' | 'invite';
export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';
export type RSVPStatus = 'going' | 'maybe' | 'not_going' | 'no_response';
export type ViewMode = 'month' | 'week' | 'day' | 'list';

// Calendar Event
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;

  // Timing
  startDate: string;
  endDate: string | null; // Null for single-day events
  allDay: boolean;
  timezone: string;

  // Type and recurrence
  type: EventType; // Alias for backward compatibility
  eventType: EventType;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string | null;
  recurrenceCount?: number; // Number of occurrences
  recurrence?: {
    pattern: RecurrencePattern;
    interval?: number;
    endDate?: string | null;
    count?: number;
  };

  // Location
  location?: string;
  locationUrl?: string; // For virtual events

  // Category
  categoryId: string | null;
  categoryName?: string;
  categoryColor?: string;

  // Author
  authorId: string;
  authorUsername: string;
  authorAvatarUrl: string | null;

  // Visibility
  visibility: EventVisibility;
  forumId?: string | null; // If forum-specific

  // RSVP
  rsvpEnabled: boolean;
  rsvpDeadline?: string | null;
  maxAttendees?: number | null;
  attendeeCount: number;
  myRsvp?: RSVPStatus;

  // Meta
  createdAt: string;
  updatedAt: string;
}

// Event Category
export interface EventCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  isDefault?: boolean;
  order: number;
}

// Event RSVP
export interface EventRSVP {
  id: string;
  eventId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: RSVPStatus;
  note?: string;
  respondedAt: string;
}

// Create/Edit event data
export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  allDay?: boolean;
  timezone?: string;
  type?: EventType;
  eventType?: EventType;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string | null;
  recurrence?: {
    pattern: RecurrencePattern;
    interval?: number;
    endDate?: string | null;
    count?: number;
  };
  location?: string;
  locationUrl?: string;
  categoryId?: string | null;
  visibility?: EventVisibility;
  forumId?: string | null;
  rsvpEnabled?: boolean;
  rsvpDeadline?: string | null;
  maxAttendees?: number | null;
}

// Calendar view filters
export interface CalendarFilters {
  year: number;
  month: number;
  categoryId?: string;
  visibility?: EventVisibility;
  authorId?: string;
  forumId?: string;
}

interface CalendarState {
  // Events
  events: CalendarEvent[];
  currentEvent: CalendarEvent | null;

  // Categories
  categories: EventCategory[];

  // RSVPs
  eventRsvps: Map<string, EventRSVP[]>;

  // View state
  currentYear: number;
  currentMonth: number;
  viewMode: 'month' | 'week' | 'day' | 'list';

  // Loading
  isLoading: boolean;
  isLoadingEvent: boolean;

  // Actions - Events
  fetchEvents: (filters?: CalendarFilters) => Promise<void>;
  fetchEvent: (id: string) => Promise<CalendarEvent | null>;
  createEvent: (data: EventFormData) => Promise<CalendarEvent>;
  updateEvent: (id: string, data: Partial<EventFormData>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Actions - Categories
  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<EventCategory>) => Promise<EventCategory>;
  updateCategory: (id: string, data: Partial<EventCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Actions - RSVP
  fetchRsvps: (eventId: string) => Promise<EventRSVP[]>;
  rsvp: (eventId: string, status: RSVPStatus, note?: string) => Promise<void>;
  cancelRsvp: (eventId: string) => Promise<void>;

  // Actions - View
  setViewMode: (mode: 'month' | 'week' | 'day' | 'list') => void;
  goToMonth: (year: number, month: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;

  // Helpers
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
  getUpcomingEvents: (limit?: number) => CalendarEvent[];

  clearState: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => {
  const now = new Date();

  return {
    // Initial state
    events: [],
    currentEvent: null,
    categories: [],
    eventRsvps: new Map(),
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth(),
    viewMode: 'month',
    isLoading: false,
    isLoadingEvent: false,

    // ========================================
    // EVENTS
    // ========================================

    fetchEvents: async (filters?: CalendarFilters) => {
      set({ isLoading: true });
      try {
        const year = filters?.year ?? get().currentYear;
        const month = filters?.month ?? get().currentMonth;

        const response = await api.get('/api/v1/calendar/events', {
          params: {
            year,
            month: month + 1, // API uses 1-indexed months
            category_id: filters?.categoryId,
            visibility: filters?.visibility,
            author_id: filters?.authorId,
            forum_id: filters?.forumId,
          },
        });

        const events = (ensureArray(response.data, 'events') as Record<string, unknown>[]).map(
          mapEventFromApi
        );
        set({ events, isLoading: false });
      } catch (error) {
        logger.error('[calendarStore] Failed to fetch events:', error);
        set({ isLoading: false });
      }
    },

    fetchEvent: async (id: string) => {
      set({ isLoadingEvent: true });
      try {
        const response = await api.get(`/api/v1/calendar/events/${id}`);
        const event = mapEventFromApi(response.data.event || response.data);
        set({ currentEvent: event, isLoadingEvent: false });
        return event;
      } catch (error) {
        logger.error('[calendarStore] Failed to fetch event:', error);
        set({ isLoadingEvent: false });
        return null;
      }
    },

    createEvent: async (data: EventFormData) => {
      try {
        const response = await api.post('/api/v1/calendar/events', {
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          all_day: data.allDay ?? false,
          timezone: data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          event_type: data.eventType ?? 'single',
          is_recurring: data.isRecurring ?? false,
          recurrence_pattern: data.recurrencePattern,
          recurrence_end_date: data.recurrenceEndDate,
          location: data.location,
          location_url: data.locationUrl,
          category_id: data.categoryId,
          visibility: data.visibility ?? 'public',
          forum_id: data.forumId,
          rsvp_enabled: data.rsvpEnabled ?? false,
          rsvp_deadline: data.rsvpDeadline,
          max_attendees: data.maxAttendees,
        });

        const event = mapEventFromApi(response.data.event || response.data);
        set((state) => ({
          events: [...state.events, event],
        }));
        return event;
      } catch (error) {
        logger.error('[calendarStore] Failed to create event:', error);
        throw error;
      }
    },

    updateEvent: async (id: string, data: Partial<EventFormData>) => {
      try {
        const response = await api.put(`/api/v1/calendar/events/${id}`, {
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          all_day: data.allDay,
          timezone: data.timezone,
          event_type: data.eventType,
          is_recurring: data.isRecurring,
          recurrence_pattern: data.recurrencePattern,
          recurrence_end_date: data.recurrenceEndDate,
          location: data.location,
          location_url: data.locationUrl,
          category_id: data.categoryId,
          visibility: data.visibility,
          forum_id: data.forumId,
          rsvp_enabled: data.rsvpEnabled,
          rsvp_deadline: data.rsvpDeadline,
          max_attendees: data.maxAttendees,
        });

        const updated = mapEventFromApi(response.data.event || response.data);
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? updated : e)),
          currentEvent: state.currentEvent?.id === id ? updated : state.currentEvent,
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to update event:', error);
        throw error;
      }
    },

    deleteEvent: async (id: string) => {
      try {
        await api.delete(`/api/v1/calendar/events/${id}`);
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to delete event:', error);
        throw error;
      }
    },

    // ========================================
    // CATEGORIES
    // ========================================

    fetchCategories: async () => {
      try {
        const response = await api.get('/api/v1/calendar/categories');
        const categories = (
          ensureArray(response.data, 'categories') as Record<string, unknown>[]
        ).map((c) => ({
          id: c.id as string,
          name: (c.name as string) || 'Uncategorized',
          color: (c.color as string) || '#6366f1',
          icon: c.icon as string | undefined,
          description: c.description as string | undefined,
          isDefault: (c.is_default as boolean) || false,
          order: (c.order as number) || 0,
        }));
        set({ categories });
      } catch (error) {
        logger.error('[calendarStore] Failed to fetch categories:', error);
      }
    },

    createCategory: async (data: Partial<EventCategory>) => {
      try {
        const response = await api.post('/api/v1/calendar/categories', {
          name: data.name,
          color: data.color,
          icon: data.icon,
          description: data.description,
        });

        const category = {
          id: response.data.category?.id || response.data.id,
          name: response.data.category?.name || response.data.name,
          color: response.data.category?.color || response.data.color || '#6366f1',
          icon: response.data.category?.icon || response.data.icon,
          description: response.data.category?.description || response.data.description,
          isDefault: false,
          order: get().categories.length,
        };

        set((state) => ({
          categories: [...state.categories, category],
        }));
        return category;
      } catch (error) {
        logger.error('[calendarStore] Failed to create category:', error);
        throw error;
      }
    },

    updateCategory: async (id: string, data: Partial<EventCategory>) => {
      try {
        await api.put(`/api/v1/calendar/categories/${id}`, {
          name: data.name,
          color: data.color,
          icon: data.icon,
          description: data.description,
        });

        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to update category:', error);
        throw error;
      }
    },

    deleteCategory: async (id: string) => {
      try {
        await api.delete(`/api/v1/calendar/categories/${id}`);
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to delete category:', error);
        throw error;
      }
    },

    // ========================================
    // RSVP
    // ========================================

    fetchRsvps: async (eventId: string) => {
      try {
        const response = await api.get(`/api/v1/calendar/events/${eventId}/rsvps`);
        const rsvps = (ensureArray(response.data, 'rsvps') as Record<string, unknown>[]).map(
          (r) => ({
            id: r.id as string,
            eventId: r.event_id as string,
            userId: r.user_id as string,
            username: (r.username as string) || 'Unknown',
            displayName: (r.display_name as string) || null,
            avatarUrl: (r.avatar_url as string) || null,
            status: (r.status as RSVPStatus) || 'no_response',
            note: r.note as string | undefined,
            respondedAt: (r.responded_at as string) || new Date().toISOString(),
          })
        );

        set((state) => {
          const updated = new Map(state.eventRsvps);
          updated.set(eventId, rsvps);
          return { eventRsvps: updated };
        });
        return rsvps;
      } catch (error) {
        logger.error('[calendarStore] Failed to fetch RSVPs:', error);
        return [];
      }
    },

    rsvp: async (eventId: string, status: RSVPStatus, note?: string) => {
      try {
        await api.post(`/api/v1/calendar/events/${eventId}/rsvp`, {
          status,
          note,
        });

        // Update local event
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  myRsvp: status,
                  attendeeCount:
                    status === 'going' && e.myRsvp !== 'going'
                      ? e.attendeeCount + 1
                      : status !== 'going' && e.myRsvp === 'going'
                        ? e.attendeeCount - 1
                        : e.attendeeCount,
                }
              : e
          ),
          currentEvent:
            state.currentEvent?.id === eventId
              ? { ...state.currentEvent, myRsvp: status }
              : state.currentEvent,
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to RSVP:', error);
        throw error;
      }
    },

    cancelRsvp: async (eventId: string) => {
      try {
        await api.delete(`/api/v1/calendar/events/${eventId}/rsvp`);

        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  myRsvp: 'no_response',
                  attendeeCount: e.myRsvp === 'going' ? e.attendeeCount - 1 : e.attendeeCount,
                }
              : e
          ),
          currentEvent:
            state.currentEvent?.id === eventId
              ? { ...state.currentEvent, myRsvp: 'no_response' }
              : state.currentEvent,
        }));
      } catch (error) {
        logger.error('[calendarStore] Failed to cancel RSVP:', error);
        throw error;
      }
    },

    // ========================================
    // VIEW NAVIGATION
    // ========================================

    setViewMode: (mode) => set({ viewMode: mode }),

    goToMonth: (year, month) => {
      set({ currentYear: year, currentMonth: month });
      get().fetchEvents({ year, month });
    },

    goToPreviousMonth: () => {
      const { currentYear, currentMonth } = get();
      const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      get().goToMonth(newYear, newMonth);
    },

    goToNextMonth: () => {
      const { currentYear, currentMonth } = get();
      const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      get().goToMonth(newYear, newMonth);
    },

    goToToday: () => {
      const now = new Date();
      get().goToMonth(now.getFullYear(), now.getMonth());
    },

    // ========================================
    // HELPERS
    // ========================================

    getEventsForDate: (date: Date) => {
      const { events } = get();
      const dateStr = date.toISOString().split('T')[0];

      return events.filter((event) => {
        const eventStart = event.startDate?.split('T')[0];
        const eventEnd = event.endDate?.split('T')[0] || eventStart;
        if (!dateStr || !eventStart || !eventEnd) return false;
        return dateStr >= eventStart && dateStr <= eventEnd;
      });
    },

    getEventsForMonth: (year: number, month: number) => {
      const { events } = get();

      return events.filter((event) => {
        const eventDate = new Date(event.startDate);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      });
    },

    getUpcomingEvents: (limit = 5) => {
      const { events } = get();
      const now = new Date();

      return events
        .filter((event) => new Date(event.startDate) >= now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, limit);
    },

    clearState: () => {
      set({
        events: [],
        currentEvent: null,
        eventRsvps: new Map(),
      });
    },
  };
});

// ========================================
// API MAPPING HELPER
// ========================================

function mapEventFromApi(data: Record<string, unknown>): CalendarEvent {
  const author = (data.author as Record<string, unknown>) || {};
  const category = (data.category as Record<string, unknown>) || {};
  const eventType = (data.event_type as EventType) || 'single';

  return {
    id: data.id as string,
    title: (data.title as string) || 'Untitled Event',
    description: (data.description as string) || '',
    startDate: (data.start_date as string) || new Date().toISOString(),
    endDate: (data.end_date as string) || null,
    allDay: (data.all_day as boolean) || false,
    timezone: (data.timezone as string) || 'UTC',
    type: eventType,
    eventType: eventType,
    isRecurring: (data.is_recurring as boolean) || false,
    recurrencePattern: data.recurrence_pattern as RecurrencePattern | undefined,
    recurrenceEndDate: (data.recurrence_end_date as string) || null,
    recurrenceCount: data.recurrence_count as number | undefined,
    recurrence: data.recurrence_pattern
      ? {
          pattern: data.recurrence_pattern as RecurrencePattern,
          interval: (data.recurrence_interval as number) || 1,
          endDate: (data.recurrence_end_date as string) || null,
          count: data.recurrence_count as number | undefined,
        }
      : undefined,
    location: data.location as string | undefined,
    locationUrl: data.location_url as string | undefined,
    categoryId: (data.category_id as string) || null,
    categoryName: (category.name as string) || undefined,
    categoryColor: (category.color as string) || undefined,
    authorId: (data.author_id as string) || (author.id as string) || '',
    authorUsername: (author.username as string) || 'Unknown',
    authorAvatarUrl: (author.avatar_url as string) || null,
    visibility: (data.visibility as EventVisibility) || 'public',
    forumId: (data.forum_id as string) || null,
    rsvpEnabled: (data.rsvp_enabled as boolean) || false,
    rsvpDeadline: (data.rsvp_deadline as string) || null,
    maxAttendees: (data.max_attendees as number) || null,
    attendeeCount: (data.attendee_count as number) || 0,
    myRsvp: data.my_rsvp as RSVPStatus | undefined,
    createdAt: (data.created_at as string) || new Date().toISOString(),
    updatedAt: (data.updated_at as string) || new Date().toISOString(),
  };
}
