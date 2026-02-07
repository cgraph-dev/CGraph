/**
 * Calendar module barrel exports
 * @module modules/social/components/calendar
 */

// ── Main component ──────────────────────────────────────────────────
export { default, default as CalendarView } from './CalendarView';

// ── Sub-components ──────────────────────────────────────────────────
export { CalendarHeader } from './CalendarHeader';
export type { CalendarHeaderProps } from './CalendarHeader';

export { CalendarGrid } from './CalendarGrid';
export type { CalendarGridProps } from './CalendarGrid';

export { CalendarSidebar } from './CalendarSidebar';
export type { CalendarSidebarProps } from './CalendarSidebar';

// ── Utilities ───────────────────────────────────────────────────────
export { formatTime, getCategoryColor, getEventTypeIcon, isToday } from './calendarUtils';
export type { CalendarCategory } from './calendarUtils';
