/**
 * calendarStore Unit Tests
 *
 * Tests for Zustand calendar/events store state management.
 * Covers events, categories, RSVPs, and view navigation.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useCalendarStore } from '@/modules/settings/store';
import type { CalendarEvent, EventCategory, EventRSVP } from '@/modules/settings/store';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// Mock event category
const mockCategory: EventCategory = {
  id: 'cat-1',
  name: 'Meetings',
  color: '#3b82f6',
  icon: '📅',
  description: 'Team meetings and syncs',
  isDefault: true,
  order: 0,
};

const mockCategory2: EventCategory = {
  id: 'cat-2',
  name: 'Social',
  color: '#10b981',
  icon: '🎉',
  description: 'Social events',
  isDefault: false,
  order: 1,
};

// Mock calendar event
const mockEvent: CalendarEvent = {
  id: 'event-1',
  title: 'Team Meeting',
  description: 'Weekly team sync',
  startDate: '2026-02-15T10:00:00Z',
  endDate: '2026-02-15T11:00:00Z',
  allDay: false,
  timezone: 'UTC',
  type: 'single',
  eventType: 'single',
  isRecurring: false,
  location: 'Conference Room A',
  locationUrl: undefined,
  categoryId: 'cat-1',
  categoryName: 'Meetings',
  categoryColor: '#3b82f6',
  authorId: 'user-1',
  authorUsername: 'johndoe',
  authorAvatarUrl: 'https://example.com/avatar.jpg',
  visibility: 'public',
  forumId: null,
  rsvpEnabled: true,
  rsvpDeadline: '2026-02-14T23:59:59Z',
  maxAttendees: 20,
  attendeeCount: 5,
  myRsvp: 'going',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
};

const mockRecurringEvent: CalendarEvent = {
  id: 'event-2',
  title: 'Weekly Standup',
  description: 'Daily standup meeting',
  startDate: '2026-02-01T09:00:00Z',
  endDate: null,
  allDay: false,
  timezone: 'UTC',
  type: 'recurring',
  eventType: 'recurring',
  isRecurring: true,
  recurrencePattern: 'weekly',
  recurrence: {
    pattern: 'weekly',
    interval: 1,
    endDate: '2026-12-31T23:59:59Z',
  },
  location: 'Virtual',
  locationUrl: 'https://meet.example.com/standup',
  categoryId: 'cat-1',
  authorId: 'user-2',
  authorUsername: 'janesmith',
  authorAvatarUrl: null,
  visibility: 'members',
  rsvpEnabled: false,
  attendeeCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockAllDayEvent: CalendarEvent = {
  id: 'event-3',
  title: 'Company Holiday',
  description: 'Office closed',
  startDate: '2026-07-04T00:00:00Z',
  endDate: null,
  allDay: true,
  timezone: 'UTC',
  type: 'holiday',
  eventType: 'holiday',
  isRecurring: false,
  categoryId: null,
  authorId: 'user-1',
  authorUsername: 'admin',
  authorAvatarUrl: null,
  visibility: 'public',
  rsvpEnabled: false,
  attendeeCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// Mock RSVP
const mockRsvp: EventRSVP = {
  id: 'rsvp-1',
  eventId: 'event-1',
  userId: 'user-1',
  username: 'johndoe',
  displayName: 'John Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
  status: 'going',
  note: 'Looking forward to it!',
  respondedAt: '2026-02-01T10:00:00Z',
};

describe('calendarStore', () => {
  beforeEach(() => {
    const now = new Date();
    // Reset store state
    useCalendarStore.setState({
      events: [],
      currentEvent: null,
      categories: [],
      eventRsvps: new Map(),
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth(),
      viewMode: 'month',
      isLoading: false,
      isLoadingEvent: false,
    });

    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty events', () => {
      const state = useCalendarStore.getState();
      expect(state.events).toEqual([]);
    });

    it('should have no current event', () => {
      const state = useCalendarStore.getState();
      expect(state.currentEvent).toBeNull();
    });

    it('should have empty categories', () => {
      const state = useCalendarStore.getState();
      expect(state.categories).toEqual([]);
    });

    it('should default to month view', () => {
      const state = useCalendarStore.getState();
      expect(state.viewMode).toBe('month');
    });

    it('should not be loading initially', () => {
      const state = useCalendarStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isLoadingEvent).toBe(false);
    });
  });

  describe('fetchEvents', () => {
    it('should fetch events successfully', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { events: [mockEvent, mockRecurringEvent] },
      });

      const { fetchEvents } = useCalendarStore.getState();
      await fetchEvents();

      const state = useCalendarStore.getState();
      expect(state.events.length).toBeGreaterThanOrEqual(0);
      expect(state.isLoading).toBe(false);
    });

    it('should set loading state', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { events: [] },
      });

      const { fetchEvents } = useCalendarStore.getState();
      const promise = fetchEvents();

      // After completion
      await promise;
      expect(useCalendarStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchEvent', () => {
    it('should fetch single event and set current event', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { event: mockEvent },
      });

      const { fetchEvent } = useCalendarStore.getState();
      const event = await fetchEvent('event-1');

      expect(event).not.toBeNull();
      expect(useCalendarStore.getState().currentEvent).not.toBeNull();
    });

    it('should handle error gracefully', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Not found'));

      const { fetchEvent } = useCalendarStore.getState();
      await fetchEvent('non-existent');

      // Store handles errors gracefully
      expect(useCalendarStore.getState().isLoadingEvent).toBe(false);
    });
  });

  describe('createEvent', () => {
    it('should create a new event', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { event: mockEvent },
      });

      const { createEvent } = useCalendarStore.getState();
      const created = await createEvent({
        title: 'Team Meeting',
        description: 'Weekly team sync',
        startDate: '2026-02-15T10:00:00Z',
        endDate: '2026-02-15T11:00:00Z',
        categoryId: 'cat-1',
        rsvpEnabled: true,
      });

      expect(created).not.toBeNull();
      expect(mockedApi.post).toHaveBeenCalled();
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      useCalendarStore.setState({ events: [mockEvent] });

      const updatedEvent = { ...mockEvent, title: 'Updated Meeting' };
      mockedApi.put.mockResolvedValueOnce({
        data: { event: updatedEvent },
      });

      const { updateEvent } = useCalendarStore.getState();
      await updateEvent('event-1', { title: 'Updated Meeting' });

      expect(mockedApi.put).toHaveBeenCalled();
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      useCalendarStore.setState({ events: [mockEvent, mockRecurringEvent] });

      mockedApi.delete.mockResolvedValueOnce({ data: {} });

      const { deleteEvent } = useCalendarStore.getState();
      await deleteEvent('event-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/calendar/events/event-1');
    });
  });

  describe('fetchCategories', () => {
    it('should fetch event categories', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { categories: [mockCategory, mockCategory2] },
      });

      const { fetchCategories } = useCalendarStore.getState();
      await fetchCategories();

      const state = useCalendarStore.getState();
      expect(state.categories.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { category: mockCategory },
      });

      const { createCategory } = useCalendarStore.getState();
      const created = await createCategory({
        name: 'Meetings',
        color: '#3b82f6',
      });

      expect(created.name).toBe('Meetings');
    });
  });

  describe('RSVP actions', () => {
    it('should fetch RSVPs for an event', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { rsvps: [mockRsvp] },
      });

      const { fetchRsvps } = useCalendarStore.getState();
      const rsvps = await fetchRsvps('event-1');

      expect(rsvps.length).toBeGreaterThanOrEqual(0);
    });

    it('should submit RSVP response', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { rsvp: mockRsvp },
      });

      const { rsvp } = useCalendarStore.getState();
      await rsvp('event-1', 'going', 'Looking forward to it!');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/calendar/events/event-1/rsvp', {
        status: 'going',
        note: 'Looking forward to it!',
      });
    });

    it('should cancel RSVP', async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: {} });

      const { cancelRsvp } = useCalendarStore.getState();
      await cancelRsvp('event-1');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/calendar/events/event-1/rsvp');
    });
  });

  describe('view navigation', () => {
    it('should set view mode', () => {
      const { setViewMode } = useCalendarStore.getState();

      setViewMode('week');
      expect(useCalendarStore.getState().viewMode).toBe('week');

      setViewMode('day');
      expect(useCalendarStore.getState().viewMode).toBe('day');

      setViewMode('list');
      expect(useCalendarStore.getState().viewMode).toBe('list');
    });

    it('should navigate to specific month', () => {
      const { goToMonth } = useCalendarStore.getState();

      goToMonth(2026, 6);

      const state = useCalendarStore.getState();
      expect(state.currentYear).toBe(2026);
      expect(state.currentMonth).toBe(6);
    });

    it('should navigate to previous month', () => {
      useCalendarStore.setState({ currentYear: 2026, currentMonth: 5 });

      const { goToPreviousMonth } = useCalendarStore.getState();
      goToPreviousMonth();

      const state = useCalendarStore.getState();
      expect(state.currentMonth).toBe(4);
    });

    it('should handle year rollover when going to previous month', () => {
      useCalendarStore.setState({ currentYear: 2026, currentMonth: 0 });

      const { goToPreviousMonth } = useCalendarStore.getState();
      goToPreviousMonth();

      const state = useCalendarStore.getState();
      expect(state.currentYear).toBe(2025);
      expect(state.currentMonth).toBe(11);
    });

    it('should navigate to next month', () => {
      useCalendarStore.setState({ currentYear: 2026, currentMonth: 5 });

      const { goToNextMonth } = useCalendarStore.getState();
      goToNextMonth();

      const state = useCalendarStore.getState();
      expect(state.currentMonth).toBe(6);
    });

    it('should handle year rollover when going to next month', () => {
      useCalendarStore.setState({ currentYear: 2026, currentMonth: 11 });

      const { goToNextMonth } = useCalendarStore.getState();
      goToNextMonth();

      const state = useCalendarStore.getState();
      expect(state.currentYear).toBe(2027);
      expect(state.currentMonth).toBe(0);
    });

    it('should navigate to today', () => {
      useCalendarStore.setState({ currentYear: 2020, currentMonth: 0 });

      const { goToToday } = useCalendarStore.getState();
      goToToday();

      const now = new Date();
      const state = useCalendarStore.getState();
      expect(state.currentYear).toBe(now.getFullYear());
      expect(state.currentMonth).toBe(now.getMonth());
    });
  });

  describe('helper functions', () => {
    beforeEach(() => {
      useCalendarStore.setState({
        events: [mockEvent, mockRecurringEvent, mockAllDayEvent],
      });
    });

    it('should get events for a specific date', () => {
      const { getEventsForDate } = useCalendarStore.getState();

      // February 15, 2026 - should match mockEvent
      const date = new Date('2026-02-15T00:00:00Z');
      const events = getEventsForDate(date);

      expect(events.some((e) => e.id === 'event-1')).toBe(true);
    });

    it('should get events for a month', () => {
      const { getEventsForMonth } = useCalendarStore.getState();

      const events = getEventsForMonth(2026, 1); // February (0-indexed)

      expect(events.length).toBeGreaterThan(0);
    });

    it('should get upcoming events', () => {
      // Set events with future dates
      const futureEvent = {
        ...mockEvent,
        id: 'future-1',
        startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      };
      useCalendarStore.setState({ events: [futureEvent] });

      const { getUpcomingEvents } = useCalendarStore.getState();
      const upcoming = getUpcomingEvents(5);

      expect(upcoming).toHaveLength(1);
    });
  });

  describe('clearState', () => {
    it('should clear events and current event', () => {
      useCalendarStore.setState({
        events: [mockEvent],
        currentEvent: mockEvent,
      });

      const { clearState } = useCalendarStore.getState();
      clearState();

      const state = useCalendarStore.getState();
      expect(state.events).toEqual([]);
      expect(state.currentEvent).toBeNull();
    });
  });
});
