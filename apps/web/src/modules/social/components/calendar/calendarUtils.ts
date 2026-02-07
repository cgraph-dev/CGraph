/**
 * Calendar Utility Functions
 *
 * Date formatting, category colour look-ups, and event-type icon helpers.
 *
 * @module modules/social/components/calendar/calendarUtils
 */

import type { EventType } from '@/stores/calendarStore';

/** Category colour type */
export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
}

/** Format a date-string to a short time like "3:30 PM" */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Look up a category colour or return the default indigo */
export function getCategoryColor(
  categories: CalendarCategory[],
  categoryId?: string | null
): string {
  if (!categoryId) return '#6366f1';
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.color || '#6366f1';
}

/** Emoji icon for an event type */
export function getEventTypeIcon(type: EventType | undefined): string {
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
}

/** Check whether a date is today */
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
