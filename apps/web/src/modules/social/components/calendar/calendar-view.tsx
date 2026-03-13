/**
 * Calendar View
 *
 * Orchestrator that wires the calendar store to
 * CalendarHeader, CalendarGrid, and CalendarSidebar.
 *
 * @module modules/social/components/calendar/CalendarView
 */

import { useEffect, useMemo } from 'react';
import { useCalendarStore, type CalendarEvent } from '@/modules/settings/store';
import { CalendarHeader } from './calendar-header';
import { CalendarGrid } from './calendar-grid';
import { CalendarSidebar } from './calendar-sidebar';

/** Props for CalendarView */
interface CalendarViewProps {
  /** Callback to open the create-event dialog */
  onCreateEvent?: () => void;
  /** Callback when a calendar event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
}

/** Full calendar page — header + month grid + sidebar */
export default function CalendarView({ onCreateEvent, onEventClick }: CalendarViewProps) {
  const {
    events,
    categories,
    currentYear,
    currentMonth,
    viewMode,
    isLoading,
    fetchEvents,
    fetchCategories,
    setViewMode,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    getEventsForDate,
    getUpcomingEvents,
  } = useCalendarStore();

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [fetchEvents, fetchCategories]);

  const monthName = useMemo(() => {
    const date = new Date(currentYear, currentMonth);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentYear, currentMonth, i));
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentYear, currentMonth]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const upcomingEvents = useMemo(() => getUpcomingEvents(5), [getUpcomingEvents, events]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <CalendarHeader
        monthName={monthName}
        viewMode={viewMode}
        setViewMode={setViewMode}
        goToPreviousMonth={goToPreviousMonth}
        goToNextMonth={goToNextMonth}
        goToToday={goToToday}
        onCreateEvent={onCreateEvent}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main grid (3/4) */}
        <div className="lg:col-span-3">
          <div className="bg-card border-border overflow-hidden rounded-lg border">
            <CalendarGrid
              calendarDays={calendarDays}
              isLoading={isLoading}
              categories={categories}
              getEventsForDate={getEventsForDate}
              onEventClick={onEventClick}
            />
          </div>
        </div>

        {/* Sidebar (1/4) */}
        <CalendarSidebar
          upcomingEvents={upcomingEvents}
          categories={categories}
          calendarDays={calendarDays}
          monthName={monthName}
          getEventsForDate={getEventsForDate}
          onEventClick={onEventClick}
        />
      </div>
    </div>
  );
}
