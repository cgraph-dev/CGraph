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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        </div>

        {onCreateEvent && (
          <button
            onClick={onCreateEvent}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            New Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Previous month"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Next month"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold text-foreground ml-2">
                  {monthName}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  Today
                </button>
                
                {/* View mode toggle */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                  {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors capitalize ${
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
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading calendar...</p>
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="px-2 py-3 text-center text-sm font-medium text-muted-foreground bg-muted/30"
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
                          className="min-h-[100px] p-2 border-b border-r border-border bg-muted/10"
                        />
                      );
                    }

                    const dayEvents = getEventsForDate(date);
                    const isCurrentDay = isToday(date);

                    return (
                      <div
                        key={date.toISOString()}
                        className={`min-h-[100px] p-2 border-b border-r border-border transition-colors ${
                          isCurrentDay ? 'bg-primary/5' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isCurrentDay
                              ? 'w-7 h-7 flex items-center justify-center bg-primary text-primary-foreground rounded-full'
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
                              className="w-full text-left text-xs p-1 rounded truncate hover:opacity-80 transition-opacity"
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
                            <div className="text-xs text-muted-foreground text-center">
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
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Upcoming Events</h3>
            </div>
            
            {upcomingEvents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No upcoming events
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(event.categoryId) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {getEventTypeIcon(event.type)} {event.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <ClockIcon className="h-3 w-3" />
                          {new Date(event.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                          {!event.allDay && ` at ${formatTime(event.startDate)}`}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
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

            <div className="p-3 border-t border-border">
              <Link
                to="/calendar/events"
                className="text-sm text-primary hover:underline"
              >
                View all events →
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Categories</h3>
            </div>
            
            {categories.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No categories
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-foreground">{category.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mini calendar */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-center mb-3">
              <span className="text-sm font-medium text-foreground">{monthName}</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-muted-foreground font-medium">
                  {d}
                </div>
              ))}
              {calendarDays.map((date, index) => (
                <div
                  key={index}
                  className={`text-center p-1 rounded ${
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
