import { create } from 'zustand';

// Re-export all types from the types file
export * from './calendarStore.types';

import type { CalendarState } from './calendarStore.types';

import { createEventActions } from './calendar-events';
import { createCategoryActions } from './calendar-categories';
import { createRsvpActions } from './calendar-rsvp';

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
 *
 * Action slices live in:
 *   calendar-events.ts      – event CRUD + API mapper
 *   calendar-categories.ts  – category CRUD
 *   calendar-rsvp.ts        – RSVP actions
 */

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

    // Delegated action slices
    ...createEventActions(set, get),
    ...createCategoryActions(set, get),
    ...createRsvpActions(set, get),

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

    reset: () => {
      const now = new Date();
      set({
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
    },
  };
});
