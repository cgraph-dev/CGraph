/**
 * Calendar Events — CRUD actions and API mapping helper
 */
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { ensureArray, isRecord } from '@/lib/apiUtils';

import type {
  CalendarEvent,
  CalendarState,
  CalendarFilters,
  EventFormData,
  EventType,
  EventVisibility,
  RecurrencePattern,
  RSVPStatus,
} from './calendarStore.types';

const logger = createLogger('calendarStore');

// ========================================
// Zustand slice creator
// ========================================

type SetState = (
  partial: Partial<CalendarState> | ((state: CalendarState) => Partial<CalendarState>)
) => void;
type GetState = () => CalendarState;

/**
 *
 */
export function createEventActions(set: SetState, get: GetState) {
  return {
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

        // type assertion: ensureArray returns unknown[], narrowing to Record for mapping
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
        const MAX_EVENTS = 500;
        set((state) => ({
          events: [...state.events, event].slice(-MAX_EVENTS),
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
  };
}

// ========================================
// API MAPPING HELPER
// ========================================

// type assertion: mapping untyped API response fields to CalendarEvent interface
/**
 *
 */
export function mapEventFromApi(data: Record<string, unknown>): CalendarEvent {
  const author: Record<string, unknown> = isRecord(data.author) ? data.author : {};
  const category: Record<string, unknown> = isRecord(data.category) ? data.category : {};
  const eventType = (data.event_type as EventType) || 'single'; // safe downcast

  return {
    id: data.id as string, // type assertion: API response field
    title: (data.title as string) || 'Untitled Event', // type assertion: API response field
    description: (data.description as string) || '', // type assertion: API response field
    startDate: (data.start_date as string) || new Date().toISOString(), // type assertion: API response field
    endDate: (data.end_date as string) || null, // type assertion: API response field
    allDay: (data.all_day as boolean) || false, // type assertion: API response field
    timezone: (data.timezone as string) || 'UTC', // type assertion: API response field
    type: eventType,
    eventType: eventType,
    isRecurring: (data.is_recurring as boolean) || false, // type assertion: API response field
    recurrencePattern: data.recurrence_pattern as RecurrencePattern | undefined, // safe downcast
    recurrenceEndDate: (data.recurrence_end_date as string) || null, // type assertion: API response field
    recurrenceCount: data.recurrence_count as number | undefined, // type assertion: API response field
    recurrence: data.recurrence_pattern
      ? {
          pattern: data.recurrence_pattern as RecurrencePattern, // safe downcast
          interval: (data.recurrence_interval as number) || 1, // type assertion: API response field
          endDate: (data.recurrence_end_date as string) || null, // type assertion: API response field
          count: data.recurrence_count as number | undefined, // type assertion: API response field
        }
      : undefined,
    location: data.location as string | undefined, // type assertion: API response field
    locationUrl: data.location_url as string | undefined, // type assertion: API response field
    categoryId: (data.category_id as string) || null, // type assertion: API response field
    categoryName: (category.name as string) || undefined, // type assertion: API response field
    categoryColor: (category.color as string) || undefined, // type assertion: API response field
    authorId: (data.author_id as string) || (author.id as string) || '', // type assertion: API response field
    authorUsername: (author.username as string) || 'Unknown', // type assertion: API response field
    authorAvatarUrl: (author.avatar_url as string) || null, // type assertion: API response field
    visibility: (data.visibility as EventVisibility) || 'public', // safe downcast
    forumId: (data.forum_id as string) || null, // type assertion: API response field
    rsvpEnabled: (data.rsvp_enabled as boolean) || false, // type assertion: API response field
    rsvpDeadline: (data.rsvp_deadline as string) || null, // type assertion: API response field
    maxAttendees: (data.max_attendees as number) || null, // type assertion: API response field
    attendeeCount: (data.attendee_count as number) || 0, // type assertion: API response field
    myRsvp: data.my_rsvp as RSVPStatus | undefined, // safe downcast
    createdAt: (data.created_at as string) || new Date().toISOString(), // type assertion: API response field
    updatedAt: (data.updated_at as string) || new Date().toISOString(), // type assertion: API response field
  };
}
