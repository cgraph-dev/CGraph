import { useEffect, useMemo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useCalendarStore, CalendarEvent, ViewMode, EventType } from '@/stores/calendarStore';

/**
 * Calendar View Component
 *
 * MyBB-style calendar with:
 * - Month/Week/Day views
 * - Event display
 * - Navigation
 * - Quick event creation
 */

// Props
interface CalendarViewProps {
  onCreateEvent?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
}

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

  // Fetch data on mount
  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, [fetchEvents, fetchCategories]);

  // Get month name
  const monthName = useMemo(() => {
    const date = new Date(currentYear, currentMonth);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Generate calendar grid for month view
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add empty days for padding
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    // Pad to complete the last week
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [currentYear, currentMonth]);

  // Get today's date for highlighting
  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      date: now.getDate(),
    };
  }, []);

  // Check if date is today
  const isToday = (date: Date) => {
    return (
      date.getFullYear() === today.year &&
      date.getMonth() === today.month &&
      date.getDate() === today.date
    );
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Get category color
  const getCategoryColor = (categoryId?: string | null) => {
    if (!categoryId) return '#6366f1'; // Default primary
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || '#6366f1';
  };

  // Event type icon
  const getEventTypeIcon = (type: EventType | undefined) => {
    switch (type) {
      case 'birthday':
        return '🎂';
      case 'holiday':
        return '🎉';
      case 'recurring':
        return '🔄';
      default:
        return '📅';
    }
  };

  // Upcoming events
  const upcomingEvents = useMemo(() => getUpcomingEvents(5), [getUpcomingEvents, events]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-card border-border overflow-hidden rounded-lg border">
            {/* Calendar Header */}
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

                {/* View mode toggle */}
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

            {/* Calendar Grid */}
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            ) : (
              <>
                {/* Day headers */}
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

                {/* Calendar days */}
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
                    const isCurrentDay = isToday(date);

                    return (
                      <div
                        key={date.toISOString()}
                        className={`border-border min-h-[100px] border-b border-r p-2 transition-colors ${
                          isCurrentDay ? 'bg-primary/5' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div
                          className={`mb-1 text-sm font-medium ${
                            isCurrentDay
                              ? 'bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full'
                              : 'text-foreground'
                          }`}
                        >
                          {date.getDate()}
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => onEventClick?.(event)}
                              className="w-full truncate rounded p-1 text-left text-xs transition-opacity hover:opacity-80"
                              style={{
                                backgroundColor: `${getCategoryColor(event.categoryId)}20`,
                                color: getCategoryColor(event.categoryId),
                                borderLeft: `2px solid ${getCategoryColor(event.categoryId)}`,
                              }}
                              title={event.title}
                            >
                              {event.allDay ? '' : formatTime(event.startDate) + ' '}
                              {getEventTypeIcon(event.type)} {event.title}
                            </button>
                          ))}
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
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-card border-border overflow-hidden rounded-lg border">
            <div className="border-border border-b p-4">
              <h3 className="text-foreground font-semibold">Upcoming Events</h3>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center text-sm">
                No upcoming events
              </div>
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
                        style={{ backgroundColor: getCategoryColor(event.categoryId) }}
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
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-foreground">{category.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mini calendar */}
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
      </div>
    </div>
  );
}
