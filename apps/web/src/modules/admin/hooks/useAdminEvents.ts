/**
 * Admin Events Hook
 *
 * Hook for admin event management.
 *
 * @module modules/admin/hooks/useAdminEvents
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAdminStore } from '../store';
import type { EventStatus } from '../store';

/**
 * Hook for admin event management
 */
export function useAdminEvents() {
  const {
    events,
    eventFilters,
    isLoading,
    error,
    fetchEvents,
    setEventFilters,
    createEvent,
    updateEvent,
    deleteEvent,
    changeEventStatus,
  } = useAdminStore();

  // Fetch events on mount
  useEffect(() => {
    if (events.length === 0) {
      fetchEvents();
    }
  }, [events.length, fetchEvents]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    if (eventFilters.status === 'all') return events;
    return events.filter((event) => event.status === eventFilters.status);
  }, [events, eventFilters]);

  // Event stats
  const eventStats = useMemo(
    () => ({
      total: events.length,
      active: events.filter((e) => e.status === 'active').length,
      scheduled: events.filter((e) => e.status === 'scheduled').length,
      draft: events.filter((e) => e.status === 'draft').length,
      totalParticipants: events.reduce((sum, e) => sum + e.participants, 0),
    }),
    [events]
  );

  const filterByStatus = useCallback(
    (status: EventStatus | 'all') => {
      setEventFilters({ status });
    },
    [setEventFilters]
  );

  const startEvent = useCallback(
    async (id: string) => {
      await changeEventStatus(id, 'active');
    },
    [changeEventStatus]
  );

  const pauseEvent = useCallback(
    async (id: string) => {
      await changeEventStatus(id, 'paused');
    },
    [changeEventStatus]
  );

  const endEvent = useCallback(
    async (id: string) => {
      await changeEventStatus(id, 'ended');
    },
    [changeEventStatus]
  );

  return {
    events: filteredEvents,
    allEvents: events,
    filters: eventFilters,
    stats: eventStats,
    isLoading,
    error,
    refresh: fetchEvents,
    filterByStatus,
    create: createEvent,
    update: updateEvent,
    remove: deleteEvent,
    start: startEvent,
    pause: pauseEvent,
    end: endEvent,
  };
}
