/**
 * Scheduled message utility functions.
 * @module
 */
import { add, format, isBefore, type Duration } from 'date-fns';

const DATE_FORMAT = "yyyy-MM-dd'T'HH:mm";

export interface QuickScheduleOption {
  label: string;
  duration: Duration;
  time?: string;
  icon: string;
}

export const QUICK_SCHEDULE_OPTIONS: QuickScheduleOption[] = [
  { label: '1 hour', duration: { hours: 1 }, icon: '⏰' },
  { label: '3 hours', duration: { hours: 3 }, icon: '⏰' },
  { label: 'Tomorrow 9am', duration: { days: 1 }, time: '09:00', icon: '🌅' },
  { label: 'Next week', duration: { weeks: 1 }, icon: '📅' },
];

/**
 * Resolve the target date for a quick-schedule option.
 * If the option has a specific `time` string (e.g. "09:00"), the date is
 * adjusted to that time-of-day, rolling forward a day when necessary.
 */
export function resolveScheduleDate(option: QuickScheduleOption): Date {
  const date = add(new Date(), option.duration);
  if (option.time) {
    const [hours = '0', minutes = '0'] = option.time.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    if (isBefore(date, new Date())) {
      date.setDate(date.getDate() + 1);
    }
  }
  return date;
}

/**
 * Format a Date as the datetime-local input value.
 */
export function formatDateTimeLocal(date: Date): string {
  return format(date, DATE_FORMAT);
}

/**
 * Build a human-readable "time until" string (e.g. "in 3 hours and 12 minutes").
 */
export function formatTimeUntil(target: Date): string {
  const diff = target.getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 24) {
    return `in ${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const days = Math.floor(hours / 24);
  return `in ${days} day${days !== 1 ? 's' : ''}`;
}
