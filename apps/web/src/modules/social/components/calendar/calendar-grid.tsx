/**
 * Calendar Month Grid
 *
 * Renders the day-of-week header row and the month's day cells
 * with event pills inside each cell.
 *
 * @module modules/social/components/calendar/CalendarGrid
 */

import type { CalendarEvent } from '@/modules/settings/store';
import { formatTime, getCategoryColor, getEventTypeIcon, isToday } from './calendarUtils';
import type { CalendarCategory } from './calendarUtils';

/** Props for CalendarGrid */
export interface CalendarGridProps {
  /** Array of Date | null for the grid (padded to full weeks) */
  calendarDays: (Date | null)[];
  /** Whether events are loading */
  isLoading: boolean;
  /** All fetched categories */
  categories: CalendarCategory[];
  /** Return events for a specific date */
  getEventsForDate: (date: Date) => CalendarEvent[];
  /** Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
}

/** Month grid with day-of-week header and event pills */
export function CalendarGrid({
  calendarDays,
  isLoading,
  categories,
  getEventsForDate,
  onEventClick,
}: CalendarGridProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <>
      {/* Day-of-week headers */}
      <div className="border-border grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-muted-foreground bg-muted/30 px-2 py-3 text-center text-sm font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                className="border-border bg-muted/10 min-h-[100px] border-b border-r p-2"
              />
            );
          }

          const dayEvents = getEventsForDate(date);
          const current = isToday(date);

          return (
            <div
              key={date.toISOString()}
              className={`border-border min-h-[100px] border-b border-r p-2 transition-colors ${
                current ? 'bg-primary/5' : 'hover:bg-muted/30'
              }`}
            >
              <div
                className={`mb-1 text-sm font-medium ${
                  current
                    ? 'bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full'
                    : 'text-foreground'
                }`}
              >
                {date.getDate()}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const color = getCategoryColor(categories, event.categoryId);
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="w-full truncate rounded p-1 text-left text-xs transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: `${color}20`,
                        color,
                        borderLeft: `2px solid ${color}`,
                      }}
                      title={event.title}
                    >
                      {event.allDay ? '' : formatTime(event.startDate) + ' '}
                      {getEventTypeIcon(event.type)} {event.title}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-muted-foreground text-center text-xs">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
