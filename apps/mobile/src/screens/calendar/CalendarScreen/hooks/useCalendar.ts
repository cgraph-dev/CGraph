/**
 * useCalendar Hook
 *
 * Manages calendar state, navigation, and event data fetching.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import api from '../../../../lib/api';
import type { CalendarEvent } from '../types';
import {
  generateCalendarDays,
  generateFallbackEvents,
  transformApiEvents,
  getEventsForDate,
} from '../types';

export function useCalendar() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Today's date for comparison
  const today = useMemo(
    () => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      date: new Date().getDate(),
    }),
    []
  );

  // Generate calendar days
  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(events, selectedDate);
  }, [selectedDate, events]);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      const response = await api.get('/api/v1/calendar/events', {
        params: {
          start_date: startOfMonth.toISOString(),
          end_date: endOfMonth.toISOString(),
        },
      });

      const data = response.data?.data || response.data?.events || response.data || [];
      setEvents(transformApiEvents(Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      setEvents(generateFallbackEvents());
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  // Fetch events on mount and when month changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    HapticFeedback.light();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }, [currentMonth, currentYear]);

  const goToNextMonth = useCallback(() => {
    HapticFeedback.light();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }, [currentMonth, currentYear]);

  const goToToday = useCallback(() => {
    HapticFeedback.medium();
    setCurrentYear(today.year);
    setCurrentMonth(today.month);
    setSelectedDate(new Date());
  }, [today]);

  const handleDatePress = useCallback((date: Date) => {
    HapticFeedback.light();
    setSelectedDate(date);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    HapticFeedback.light();
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  // Event mutations
  const saveEvent = useCallback((eventData: Partial<CalendarEvent>) => {
    if (eventData.id) {
      // Update existing
      setEvents((prev) =>
        prev.map((e) => (e.id === eventData.id ? ({ ...e, ...eventData } as CalendarEvent) : e))
      );
    } else {
      // Create new
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventData.title || 'Untitled',
        startDate: eventData.startDate || new Date().toISOString(),
        allDay: eventData.allDay ?? true,
        type: eventData.type || 'event',
        ...eventData,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
  }, []);

  return {
    // State
    currentYear,
    currentMonth,
    selectedDate,
    events,
    calendarDays,
    selectedDateEvents,
    isLoading,
    refreshing,
    today,

    // Actions
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    handleDatePress,
    handleRefresh,
    saveEvent,
  };
}
