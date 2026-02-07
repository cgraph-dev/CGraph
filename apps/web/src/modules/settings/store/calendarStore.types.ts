/**
 * Calendar Store Types
 *
 * Type definitions, interfaces, and union types
 * for the calendar/events store.
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

// Event types
export type EventType = 'single' | 'ranged' | 'recurring' | 'birthday' | 'holiday';
export type EventVisibility = 'public' | 'members' | 'private' | 'invite';
export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';
export type RSVPStatus = 'going' | 'maybe' | 'not_going' | 'no_response';
export type ViewMode = 'month' | 'week' | 'day' | 'list';

// Calendar Event
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;

  // Timing
  startDate: string;
  endDate: string | null; // Null for single-day events
  allDay: boolean;
  timezone: string;

  // Type and recurrence
  type: EventType; // Alias for backward compatibility
  eventType: EventType;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string | null;
  recurrenceCount?: number; // Number of occurrences
  recurrence?: {
    pattern: RecurrencePattern;
    interval?: number;
    endDate?: string | null;
    count?: number;
  };

  // Location
  location?: string;
  locationUrl?: string; // For virtual events

  // Category
  categoryId: string | null;
  categoryName?: string;
  categoryColor?: string;

  // Author
  authorId: string;
  authorUsername: string;
  authorAvatarUrl: string | null;

  // Visibility
  visibility: EventVisibility;
  forumId?: string | null; // If forum-specific

  // RSVP
  rsvpEnabled: boolean;
  rsvpDeadline?: string | null;
  maxAttendees?: number | null;
  attendeeCount: number;
  myRsvp?: RSVPStatus;

  // Meta
  createdAt: string;
  updatedAt: string;
}

// Event Category
export interface EventCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  isDefault?: boolean;
  order: number;
}

// Event RSVP
export interface EventRSVP {
  id: string;
  eventId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: RSVPStatus;
  note?: string;
  respondedAt: string;
}

// Create/Edit event data
export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  allDay?: boolean;
  timezone?: string;
  type?: EventType;
  eventType?: EventType;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string | null;
  recurrence?: {
    pattern: RecurrencePattern;
    interval?: number;
    endDate?: string | null;
    count?: number;
  };
  location?: string;
  locationUrl?: string;
  categoryId?: string | null;
  visibility?: EventVisibility;
  forumId?: string | null;
  rsvpEnabled?: boolean;
  rsvpDeadline?: string | null;
  maxAttendees?: number | null;
}

// Calendar view filters
export interface CalendarFilters {
  year: number;
  month: number;
  categoryId?: string;
  visibility?: EventVisibility;
  authorId?: string;
  forumId?: string;
}

// ============================================================================
// Store Interface
// ============================================================================

export interface CalendarState {
  // Events
  events: CalendarEvent[];
  currentEvent: CalendarEvent | null;

  // Categories
  categories: EventCategory[];

  // RSVPs
  eventRsvps: Map<string, EventRSVP[]>;

  // View state
  currentYear: number;
  currentMonth: number;
  viewMode: 'month' | 'week' | 'day' | 'list';

  // Loading
  isLoading: boolean;
  isLoadingEvent: boolean;

  // Actions - Events
  fetchEvents: (filters?: CalendarFilters) => Promise<void>;
  fetchEvent: (id: string) => Promise<CalendarEvent | null>;
  createEvent: (data: EventFormData) => Promise<CalendarEvent>;
  updateEvent: (id: string, data: Partial<EventFormData>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // Actions - Categories
  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<EventCategory>) => Promise<EventCategory>;
  updateCategory: (id: string, data: Partial<EventCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Actions - RSVP
  fetchRsvps: (eventId: string) => Promise<EventRSVP[]>;
  rsvp: (eventId: string, status: RSVPStatus, note?: string) => Promise<void>;
  cancelRsvp: (eventId: string) => Promise<void>;

  // Actions - View
  setViewMode: (mode: 'month' | 'week' | 'day' | 'list') => void;
  goToMonth: (year: number, month: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;

  // Helpers
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
  getUpcomingEvents: (limit?: number) => CalendarEvent[];

  clearState: () => void;
}
