/**
 * CalendarScreen Types and Constants
 */

// ============================================================================
// TYPES
// ============================================================================

export type ViewMode = 'month' | 'week' | 'day';
export type EventType = 'event' | 'birthday' | 'holiday' | 'recurring';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  type: EventType;
  categoryId?: string;
  location?: string;
  reminder?: string;
  color?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
}

export interface EventTypeConfig {
  icon: string;
  color: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  event: { icon: 'calendar', color: '#3b82f6' },
  birthday: { icon: 'gift', color: '#ec4899' },
  holiday: { icon: 'flag', color: '#f97316' },
  recurring: { icon: 'repeat', color: '#8b5cf6' },
};

export const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: 'personal', name: 'Personal', color: '#3b82f6' },
  { id: 'work', name: 'Work', color: '#10b981' },
  { id: 'community', name: 'Community', color: '#8b5cf6' },
  { id: 'gaming', name: 'Gaming', color: '#ec4899' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate fallback events for demo/offline use
 */
export function generateFallbackEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return [
    {
      id: '1',
      title: 'Community Meeting',
      description: 'Monthly community discussion',
      startDate: new Date(year, month, 15, 14, 0).toISOString(),
      endDate: new Date(year, month, 15, 16, 0).toISOString(),
      allDay: false,
      type: 'event',
      location: 'Voice Channel',
      color: '#3b82f6',
    },
    {
      id: '2',
      title: "John's Birthday 🎂",
      startDate: new Date(year, month, 20).toISOString(),
      allDay: true,
      type: 'birthday',
    },
    {
      id: '3',
      title: 'New Year Celebration',
      startDate: new Date(year, 0, 1).toISOString(),
      allDay: true,
      type: 'holiday',
    },
    {
      id: '4',
      title: 'Weekly Gaming Session',
      startDate: new Date(year, month, now.getDate() + 2, 20, 0).toISOString(),
      endDate: new Date(year, month, now.getDate() + 2, 23, 0).toISOString(),
      allDay: false,
      type: 'recurring',
      location: 'Game Server #1',
    },
    {
      id: '5',
      title: 'Forum Maintenance',
      startDate: new Date(year, month, now.getDate() + 5, 2, 0).toISOString(),
      endDate: new Date(year, month, now.getDate() + 5, 4, 0).toISOString(),
      allDay: false,
      type: 'event',
      color: '#f97316',
    },
  ];
}

/**
 * Transform API response to CalendarEvent format
 */
export function transformApiEvents(data: unknown[]): CalendarEvent[] {
  if (!Array.isArray(data)) return [];

  return data.map((item: unknown) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const event = item as Record<string, unknown>;
    return {
      id: String(event.id || Math.random()),
      title: String(event.title || event.name || 'Untitled'),
      description:
        event.description || event.body ? String(event.description || event.body) : undefined,
      startDate: String(
        event.start_date || event.startDate || event.starts_at || new Date().toISOString()
      ),
      endDate:
        event.end_date || event.endDate || event.ends_at
          ? String(event.end_date || event.endDate || event.ends_at)
          : undefined,
      allDay: Boolean(event.all_day ?? event.allDay ?? false),

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      type: (event.type || event.event_type || 'event') as EventType,
      categoryId:
        event.category_id || event.categoryId
          ? String(event.category_id || event.categoryId)
          : undefined,
      location: event.location ? String(event.location) : undefined,
      reminder: event.reminder ? String(event.reminder) : undefined,
      color: event.color ? String(event.color) : undefined,
    };
  });
}

/**
 * Format time from ISO date string
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * Generate calendar days for a month
 */
export function generateCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: (Date | null)[] = [];

  // Padding for start
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Pad to complete last week
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventDate = new Date(event.startDate);
    return isSameDay(eventDate, date);
  });
}
