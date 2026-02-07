/**
 * Calendar Header
 *
 * Month navigation, "Today" button, and view-mode toggle.
 *
 * @module modules/social/components/calendar/CalendarHeader
 */

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import type { ViewMode } from '@/stores/calendarStore';

/** Props for CalendarHeader */
export interface CalendarHeaderProps {
  /** Formatted month + year string */
  monthName: string;
  /** Active view mode */
  viewMode: ViewMode;
  /** Switch view mode */
  setViewMode: (mode: ViewMode) => void;
  /** Navigate to previous month */
  goToPreviousMonth: () => void;
  /** Navigate to next month */
  goToNextMonth: () => void;
  /** Jump to today */
  goToToday: () => void;
  /** Optional create-event handler */
  onCreateEvent?: () => void;
}

/** Page title row + month navigation + view mode toggle */
export function CalendarHeader({
  monthName,
  viewMode,
  setViewMode,
  goToPreviousMonth,
  goToNextMonth,
  goToToday,
  onCreateEvent,
}: CalendarHeaderProps) {
  return (
    <>
      {/* Page title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-primary h-8 w-8" />
          <h1 className="text-foreground text-2xl font-bold">Calendar</h1>
        </div>

        {onCreateEvent && (
          <button
            onClick={onCreateEvent}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 flex items-center gap-2 rounded-lg px-4 py-2 transition-colors sm:mt-0"
          >
            <PlusIcon className="h-5 w-5" />
            New Event
          </button>
        )}
      </div>

      {/* Month nav + view toggle */}
      <div className="border-border flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="hover:bg-muted rounded-lg p-2 transition-colors"
            title="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="hover:bg-muted rounded-lg p-2 transition-colors"
            title="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <h2 className="text-foreground ml-2 text-lg font-semibold">{monthName}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="bg-secondary hover:bg-secondary/80 rounded-lg px-3 py-1.5 text-sm transition-colors"
          >
            Today
          </button>

          <div className="bg-muted flex items-center rounded-lg p-1">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded px-3 py-1 text-sm font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
