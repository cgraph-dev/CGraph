/**
 * Calendar Sidebar
 *
 * Upcoming events list, category legend, and mini calendar.
 *
 * @module modules/social/components/calendar/CalendarSidebar
 */

import { Link } from 'react-router-dom';
import { ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import type { CalendarEvent } from '@/modules/settings/store';
import { formatTime, getCategoryColor, getEventTypeIcon, isToday } from './calendarUtils';
import type { CalendarCategory } from './calendarUtils';

/** Props for CalendarSidebar */
export interface CalendarSidebarProps {
  /** Next N upcoming events */
  upcomingEvents: CalendarEvent[];
  /** All categories */
  categories: CalendarCategory[];
  /** Calendar grid days for the mini calendar */
  calendarDays: (Date | null)[];
  /** Formatted month + year label */
  monthName: string;
  /** Return events for a specific date */
  getEventsForDate: (date: Date) => CalendarEvent[];
  /** Callback when an event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
}

/** Sidebar with upcoming events, categories, and mini calendar */
export function CalendarSidebar({
  upcomingEvents,
  categories,
  calendarDays,
  monthName,
  getEventsForDate,
  onEventClick,
}: CalendarSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      <div className="bg-card border-border overflow-hidden rounded-lg border">
        <div className="border-border border-b p-4">
          <h3 className="text-foreground font-semibold">Upcoming Events</h3>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">No upcoming events</div>
        ) : (
          <div className="divide-border divide-y">
            {upcomingEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="hover:bg-muted/30 w-full p-4 text-left transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-full min-h-[40px] w-1 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: getCategoryColor(categories, event.categoryId) }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground truncate font-medium">
                      {getEventTypeIcon(event.type)} {event.title}
                    </div>
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                      <ClockIcon className="h-3 w-3" />
                      {new Date(event.startDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {!event.allDay && ` at ${formatTime(event.startDate)}`}
                    </div>
                    {event.location && (
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                        <MapPinIcon className="h-3 w-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="border-border border-t p-3">
          <Link to="/calendar/events" className="text-primary text-sm hover:underline">
            View all events →
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card border-border overflow-hidden rounded-lg border">
        <div className="border-border border-b p-4">
          <h3 className="text-foreground font-semibold">Categories</h3>
        </div>

        {categories.length === 0 ? (
          <div className="text-muted-foreground p-4 text-center text-sm">No categories</div>
        ) : (
          <div className="space-y-2 p-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="text-foreground">{category.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mini Calendar */}
      <div className="bg-card border-border rounded-lg border p-4">
        <div className="mb-3 text-center">
          <span className="text-foreground text-sm font-medium">{monthName}</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-muted-foreground text-center font-medium">
              {d}
            </div>
          ))}
          {calendarDays.map((date, index) => (
            <div
              key={index}
              className={`rounded p-1 text-center ${
                date
                  ? isToday(date)
                    ? 'bg-primary text-primary-foreground font-medium'
                    : getEventsForDate(date).length > 0
                      ? 'bg-primary/20 text-primary'
                      : 'text-foreground hover:bg-muted cursor-pointer'
                  : ''
              }`}
            >
              {date?.getDate() || ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
