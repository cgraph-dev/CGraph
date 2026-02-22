/**
 * Calendar module barrel exports
 * @module modules/social/components/calendar
 */

// ── Main component ──────────────────────────────────────────────────
export { default, default as CalendarView } from './calendar-view';

// ── Sub-components ──────────────────────────────────────────────────
export { CalendarHeader } from './calendar-header';
export type { CalendarHeaderProps } from './calendar-header';

export { CalendarGrid } from './calendar-grid';
export type { CalendarGridProps } from './calendar-grid';

export { CalendarSidebar } from './calendar-sidebar';
export type { CalendarSidebarProps } from './calendar-sidebar';

// ── Utilities ───────────────────────────────────────────────────────
export { formatTime, getCategoryColor, getEventTypeIcon, isToday } from './calendarUtils';
export type { CalendarCategory } from './calendarUtils';
