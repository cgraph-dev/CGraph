/**
 * useCalendar Hook
 *
 * React hook for calendar and event management functionality.
 * Provides event list, creation, and management features.
 *
 * @module hooks/useCalendar
 * @since v0.9.0
 */

import { useState, useCallback, useRef } from 'react';
import * as calendarService from '../services/calendarService';
import {
  CalendarEvent,
  CalendarMonth,
  UpcomingEvent,
  CreateEventRequest,
  UpdateEventRequest,
  Reminder,
} from '../services/calendarService';

const CACHE_DURATION = 60000; // 1 minute

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CalendarState {
  events: CalendarEvent[];
  currentMonth: CalendarMonth | null;
  upcomingEvents: UpcomingEvent[];
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  error: string | null;
}

interface UseCalendarOptions {
  autoLoad?: boolean;
  groupId?: string;
}

interface UseCalendarReturn extends CalendarState {
  // Event fetching
  loadMonth: (year: number, month: number) => Promise<void>;
  loadEvents: (startDate: string, endDate: string) => Promise<void>;
  loadUpcoming: (limit?: number) => Promise<void>;
  loadEvent: (eventId: string) => Promise<void>;

  // Event management
  createEvent: (data: CreateEventRequest) => Promise<CalendarEvent | null>;
  updateEvent: (eventId: string, data: UpdateEventRequest) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string, deleteFuture?: boolean) => Promise<boolean>;

  // RSVP
  rsvp: (eventId: string, status: 'going' | 'maybe' | 'not_going') => Promise<boolean>;
  inviteUsers: (eventId: string, userIds: string[]) => Promise<boolean>;

  // Reminders
  addReminder: (
    eventId: string,
    type: 'notification' | 'email',
    minutes: number
  ) => Promise<Reminder | null>;
  removeReminder: (eventId: string, reminderId: string) => Promise<boolean>;

  // State management
  selectEvent: (event: CalendarEvent | null) => void;
  clearError: () => void;

  // Computed
  eventsForDate: (date: string) => CalendarEvent[];
  todaysEvents: CalendarEvent[];
}

export function useCalendar(options: UseCalendarOptions = {}): UseCalendarReturn {
  const { groupId } = options;

  const [state, setState] = useState<CalendarState>({
    events: [],
    currentMonth: null,
    upcomingEvents: [],
    selectedEvent: null,
    isLoading: false,
    error: null,
  });

  const cacheRef = useRef<{
    months: Map<string, CacheEntry<CalendarMonth>>;
    upcoming?: CacheEntry<UpcomingEvent[]>;
  }>({ months: new Map() });

  const isCacheValid = useCallback(<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }, []);

  // ==================== EVENT FETCHING ====================

  const loadMonth = useCallback(
    async (year: number, month: number) => {
      const cacheKey = `${year}-${month}`;
      const cached = cacheRef.current.months.get(cacheKey);

      if (isCacheValid(cached)) {
        setState((prev) => ({ ...prev, currentMonth: cached.data }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const currentMonth = await calendarService.getMonthEvents(year, month, { groupId });
        cacheRef.current.months.set(cacheKey, { data: currentMonth, timestamp: Date.now() });
        setState((prev) => ({ ...prev, currentMonth, isLoading: false }));
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load calendar',
        }));
      }
    },
    [groupId, isCacheValid]
  );

  const loadEvents = useCallback(
    async (startDate: string, endDate: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const events = await calendarService.getEvents(startDate, endDate, { groupId });
        setState((prev) => ({ ...prev, events, isLoading: false }));
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load events',
        }));
      }
    },
    [groupId]
  );

  const loadUpcoming = useCallback(
    async (limit = 10) => {
      if (isCacheValid(cacheRef.current.upcoming)) {
        setState((prev) => ({ ...prev, upcomingEvents: cacheRef.current.upcoming!.data }));
        return;
      }

      try {
        const upcomingEvents = await calendarService.getUpcomingEvents(limit);
        cacheRef.current.upcoming = { data: upcomingEvents, timestamp: Date.now() };
        setState((prev) => ({ ...prev, upcomingEvents }));
      } catch (error) {
        console.error('Failed to load upcoming events:', error);
      }
    },
    [isCacheValid]
  );

  const loadEvent = useCallback(async (eventId: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const event = await calendarService.getEvent(eventId);
      setState((prev) => ({ ...prev, selectedEvent: event, isLoading: false }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load event',
      }));
    }
  }, []);

  // ==================== EVENT MANAGEMENT ====================

  const createEvent = useCallback(
    async (data: CreateEventRequest): Promise<CalendarEvent | null> => {
      try {
        const event = await calendarService.createEvent(data);

        // Add to events list
        setState((prev) => ({
          ...prev,
          events: [...prev.events, event],
        }));

        // Invalidate cache
        cacheRef.current.months.clear();
        cacheRef.current.upcoming = undefined;

        return event;
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create event',
        }));
        return null;
      }
    },
    []
  );

  const updateEvent = useCallback(
    async (eventId: string, data: UpdateEventRequest): Promise<CalendarEvent | null> => {
      try {
        const event = await calendarService.updateEvent(eventId, data);

        setState((prev) => ({
          ...prev,
          events: prev.events.map((e) => (e.id === eventId ? event : e)),
          selectedEvent: prev.selectedEvent?.id === eventId ? event : prev.selectedEvent,
        }));

        // Invalidate cache
        cacheRef.current.months.clear();
        cacheRef.current.upcoming = undefined;

        return event;
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update event',
        }));
        return null;
      }
    },
    []
  );

  const deleteEvent = useCallback(
    async (eventId: string, deleteFuture = false): Promise<boolean> => {
      try {
        await calendarService.deleteEvent(eventId, deleteFuture);

        setState((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.id !== eventId),
          selectedEvent: prev.selectedEvent?.id === eventId ? null : prev.selectedEvent,
        }));

        // Invalidate cache
        cacheRef.current.months.clear();
        cacheRef.current.upcoming = undefined;

        return true;
      } catch (error: unknown) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete event',
        }));
        return false;
      }
    },
    []
  );

  // ==================== RSVP ====================

  const rsvp = useCallback(
    async (eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<boolean> => {
      try {
        const event = await calendarService.rsvpToEvent(eventId, status);

        setState((prev) => ({
          ...prev,
          events: prev.events.map((e) => (e.id === eventId ? event : e)),
          selectedEvent: prev.selectedEvent?.id === eventId ? event : prev.selectedEvent,
        }));

        return true;
      } catch (error) {
        console.error('Failed to RSVP:', error);
        return false;
      }
    },
    []
  );

  const inviteUsers = useCallback(
    async (eventId: string, userIds: string[]): Promise<boolean> => {
      try {
        await calendarService.inviteToEvent(eventId, userIds);

        // Reload event to get updated attendee list
        await loadEvent(eventId);

        return true;
      } catch (error) {
        console.error('Failed to invite users:', error);
        return false;
      }
    },
    [loadEvent]
  );

  // ==================== REMINDERS ====================

  const addReminder = useCallback(
    async (
      eventId: string,
      type: 'notification' | 'email',
      minutes: number
    ): Promise<Reminder | null> => {
      try {
        const reminder = await calendarService.addReminder(eventId, { type, time: minutes });

        setState((prev) => ({
          ...prev,
          selectedEvent:
            prev.selectedEvent?.id === eventId
              ? { ...prev.selectedEvent, reminders: [...prev.selectedEvent.reminders, reminder] }
              : prev.selectedEvent,
        }));

        return reminder;
      } catch (error) {
        console.error('Failed to add reminder:', error);
        return null;
      }
    },
    []
  );

  const removeReminder = useCallback(
    async (eventId: string, reminderId: string): Promise<boolean> => {
      try {
        await calendarService.removeReminder(eventId, reminderId);

        setState((prev) => ({
          ...prev,
          selectedEvent:
            prev.selectedEvent?.id === eventId
              ? {
                  ...prev.selectedEvent,
                  reminders: prev.selectedEvent.reminders.filter((r) => r.id !== reminderId),
                }
              : prev.selectedEvent,
        }));

        return true;
      } catch (error) {
        console.error('Failed to remove reminder:', error);
        return false;
      }
    },
    []
  );

  // ==================== STATE MANAGEMENT ====================

  const selectEvent = useCallback((event: CalendarEvent | null) => {
    setState((prev) => ({ ...prev, selectedEvent: event }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ==================== COMPUTED VALUES ====================

  const eventsForDate = useCallback(
    (date: string): CalendarEvent[] => {
      const targetDate = new Date(date).toDateString();
      return state.events.filter((event) => {
        const eventDate = new Date(event.startTime).toDateString();
        return eventDate === targetDate;
      });
    },
    [state.events]
  );

  const todaysEvents = state.events.filter((event) => {
    const today = new Date().toDateString();
    const eventDate = new Date(event.startTime).toDateString();
    return eventDate === today;
  });

  return {
    ...state,
    loadMonth,
    loadEvents,
    loadUpcoming,
    loadEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    rsvp,
    inviteUsers,
    addReminder,
    removeReminder,
    selectEvent,
    clearError,
    eventsForDate,
    todaysEvents,
  };
}

export default useCalendar;
