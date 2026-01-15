/**
 * Calendar Service
 * 
 * Backend API integration for calendar/events features:
 * - Event management
 * - Reminders
 * - Scheduling
 * - Group events
 * 
 * @module services/calendarService
 * @since v0.9.0
 */

import api from '../lib/api';

// ==================== TYPES ====================

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  location: string | null;
  color: string;
  recurrence: RecurrenceRule | null;
  reminders: Reminder[];
  groupId: string | null;
  groupName: string | null;
  channelId: string | null;
  channelName: string | null;
  creatorId: string;
  creatorName: string;
  attendees: EventAttendee[];
  rsvpStatus: 'pending' | 'going' | 'maybe' | 'not_going' | null;
  isPublic: boolean;
  isRecurring: boolean;
  parentEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
  endDate: string | null;
  count: number | null;
}

export interface Reminder {
  id: string;
  type: 'notification' | 'email';
  time: number; // minutes before event
}

export interface EventAttendee {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  rsvpStatus: 'pending' | 'going' | 'maybe' | 'not_going';
  respondedAt: string | null;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  color?: string;
  recurrence?: RecurrenceRule;
  reminders?: { type: 'notification' | 'email'; time: number }[];
  groupId?: string;
  channelId?: string;
  isPublic?: boolean;
  invitees?: string[]; // user IDs
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  color?: string;
  recurrence?: RecurrenceRule | null;
  reminders?: { type: 'notification' | 'email'; time: number }[];
  isPublic?: boolean;
  updateFutureOccurrences?: boolean;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
  hasMore: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: Record<number, CalendarEvent[]>;
}

export interface UpcomingEvent {
  event: CalendarEvent;
  timeUntil: string;
  isToday: boolean;
  isTomorrow: boolean;
}

// ==================== CALENDAR API ====================

/**
 * Get events for a date range
 */
export async function getEvents(
  startDate: string,
  endDate: string,
  options?: { groupId?: string; includeDeclined?: boolean }
): Promise<CalendarEvent[]> {
  const params = {
    start_date: startDate,
    end_date: endDate,
    group_id: options?.groupId,
    include_declined: options?.includeDeclined,
  };
  const response = await api.get('/api/v1/calendar/events', { params });
  return (response.data.data || response.data.events || []).map(transformCalendarEvent);
}

/**
 * Get events for a specific month
 */
export async function getMonthEvents(
  year: number,
  month: number,
  options?: { groupId?: string }
): Promise<CalendarMonth> {
  const params = {
    year,
    month,
    group_id: options?.groupId,
  };
  const response = await api.get('/api/v1/calendar/month', { params });
  return transformCalendarMonth(response.data.data || response.data, year, month);
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(limit?: number): Promise<UpcomingEvent[]> {
  const params = limit ? { limit } : {};
  const response = await api.get('/api/v1/calendar/upcoming', { params });
  return (response.data.data || response.data.events || []).map(transformUpcomingEvent);
}

/**
 * Get event by ID
 */
export async function getEvent(eventId: string): Promise<CalendarEvent> {
  const response = await api.get(`/api/v1/calendar/events/${eventId}`);
  return transformCalendarEvent(response.data.data || response.data);
}

/**
 * Create new event
 */
export async function createEvent(data: CreateEventRequest): Promise<CalendarEvent> {
  const response = await api.post('/api/v1/calendar/events', {
    title: data.title,
    description: data.description,
    start_time: data.startTime,
    end_time: data.endTime,
    all_day: data.allDay,
    location: data.location,
    color: data.color,
    recurrence: data.recurrence ? transformRecurrenceToApi(data.recurrence) : undefined,
    reminders: data.reminders,
    group_id: data.groupId,
    channel_id: data.channelId,
    is_public: data.isPublic,
    invitees: data.invitees,
  });
  return transformCalendarEvent(response.data.data || response.data);
}

/**
 * Update event
 */
export async function updateEvent(eventId: string, data: UpdateEventRequest): Promise<CalendarEvent> {
  const response = await api.patch(`/api/v1/calendar/events/${eventId}`, {
    title: data.title,
    description: data.description,
    start_time: data.startTime,
    end_time: data.endTime,
    all_day: data.allDay,
    location: data.location,
    color: data.color,
    recurrence: data.recurrence !== undefined 
      ? (data.recurrence ? transformRecurrenceToApi(data.recurrence) : null)
      : undefined,
    reminders: data.reminders,
    is_public: data.isPublic,
    update_future_occurrences: data.updateFutureOccurrences,
  });
  return transformCalendarEvent(response.data.data || response.data);
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string, deleteFutureOccurrences?: boolean): Promise<void> {
  const params = deleteFutureOccurrences ? { delete_future: true } : {};
  await api.delete(`/api/v1/calendar/events/${eventId}`, { params });
}

/**
 * RSVP to event
 */
export async function rsvpToEvent(
  eventId: string,
  status: 'going' | 'maybe' | 'not_going'
): Promise<CalendarEvent> {
  const response = await api.post(`/api/v1/calendar/events/${eventId}/rsvp`, { status });
  return transformCalendarEvent(response.data.data || response.data);
}

/**
 * Invite users to event
 */
export async function inviteToEvent(eventId: string, userIds: string[]): Promise<EventAttendee[]> {
  const response = await api.post(`/api/v1/calendar/events/${eventId}/invite`, {
    user_ids: userIds,
  });
  return (response.data.data || response.data.attendees || []).map(transformEventAttendee);
}

/**
 * Remove attendee from event
 */
export async function removeAttendee(eventId: string, userId: string): Promise<void> {
  await api.delete(`/api/v1/calendar/events/${eventId}/attendees/${userId}`);
}

// ==================== REMINDERS API ====================

/**
 * Add reminder to event
 */
export async function addReminder(
  eventId: string,
  reminder: { type: 'notification' | 'email'; time: number }
): Promise<Reminder> {
  const response = await api.post(`/api/v1/calendar/events/${eventId}/reminders`, reminder);
  return transformReminder(response.data.data || response.data);
}

/**
 * Remove reminder from event
 */
export async function removeReminder(eventId: string, reminderId: string): Promise<void> {
  await api.delete(`/api/v1/calendar/events/${eventId}/reminders/${reminderId}`);
}

/**
 * Get pending reminders
 */
export async function getPendingReminders(): Promise<{ event: CalendarEvent; reminder: Reminder }[]> {
  const response = await api.get('/api/v1/calendar/reminders/pending');
  return (response.data.data || response.data.reminders || []).map((r: any) => ({
    event: transformCalendarEvent(r.event),
    reminder: transformReminder(r.reminder),
  }));
}

/**
 * Dismiss reminder
 */
export async function dismissReminder(eventId: string, reminderId: string): Promise<void> {
  await api.post(`/api/v1/calendar/events/${eventId}/reminders/${reminderId}/dismiss`);
}

// ==================== GROUP EVENTS API ====================

/**
 * Get group events
 */
export async function getGroupEvents(
  groupId: string,
  options?: { startDate?: string; endDate?: string; limit?: number }
): Promise<CalendarEvent[]> {
  const params = {
    start_date: options?.startDate,
    end_date: options?.endDate,
    limit: options?.limit,
  };
  const response = await api.get(`/api/v1/groups/${groupId}/events`, { params });
  return (response.data.data || response.data.events || []).map(transformCalendarEvent);
}

/**
 * Create group event
 */
export async function createGroupEvent(groupId: string, data: Omit<CreateEventRequest, 'groupId'>): Promise<CalendarEvent> {
  return createEvent({ ...data, groupId });
}

// ==================== HELPERS ====================

function transformRecurrenceToApi(rule: RecurrenceRule): any {
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    days_of_week: rule.daysOfWeek,
    day_of_month: rule.dayOfMonth,
    month_of_year: rule.monthOfYear,
    end_date: rule.endDate,
    count: rule.count,
  };
}

// ==================== TRANSFORMERS ====================

function transformRecurrenceRule(data: any): RecurrenceRule | null {
  if (!data) return null;
  return {
    frequency: data.frequency,
    interval: data.interval || 1,
    daysOfWeek: data.days_of_week || data.daysOfWeek || [],
    dayOfMonth: data.day_of_month ?? data.dayOfMonth ?? null,
    monthOfYear: data.month_of_year ?? data.monthOfYear ?? null,
    endDate: data.end_date || data.endDate || null,
    count: data.count ?? null,
  };
}

function transformReminder(data: any): Reminder {
  return {
    id: data.id,
    type: data.type || 'notification',
    time: data.time || data.minutes_before || 15,
  };
}

function transformEventAttendee(data: any): EventAttendee {
  return {
    id: data.id,
    userId: data.user_id || data.userId,
    username: data.username || data.user?.username,
    displayName: data.display_name || data.displayName || data.user?.display_name || null,
    avatarUrl: data.avatar_url || data.avatarUrl || data.user?.avatar_url || null,
    rsvpStatus: data.rsvp_status || data.rsvpStatus || 'pending',
    respondedAt: data.responded_at || data.respondedAt || null,
  };
}

function transformCalendarEvent(data: any): CalendarEvent {
  return {
    id: data.id,
    title: data.title,
    description: data.description || null,
    startTime: data.start_time || data.startTime,
    endTime: data.end_time || data.endTime || null,
    allDay: data.all_day ?? data.allDay ?? false,
    location: data.location || null,
    color: data.color || '#6366f1',
    recurrence: transformRecurrenceRule(data.recurrence),
    reminders: (data.reminders || []).map(transformReminder),
    groupId: data.group_id || data.groupId || null,
    groupName: data.group_name || data.groupName || null,
    channelId: data.channel_id || data.channelId || null,
    channelName: data.channel_name || data.channelName || null,
    creatorId: data.creator_id || data.creatorId,
    creatorName: data.creator_name || data.creatorName || data.creator?.username,
    attendees: (data.attendees || []).map(transformEventAttendee),
    rsvpStatus: data.rsvp_status || data.rsvpStatus || null,
    isPublic: data.is_public ?? data.isPublic ?? true,
    isRecurring: data.is_recurring ?? data.isRecurring ?? !!data.recurrence,
    parentEventId: data.parent_event_id || data.parentEventId || null,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
  };
}

function transformCalendarMonth(data: any, year: number, month: number): CalendarMonth {
  const days: Record<number, CalendarEvent[]> = {};
  
  if (data.days) {
    Object.entries(data.days).forEach(([day, events]) => {
      days[parseInt(day)] = (events as any[]).map(transformCalendarEvent);
    });
  } else if (data.events) {
    (data.events as any[]).forEach((event) => {
      const eventDate = new Date(event.start_time || event.startTime);
      const day = eventDate.getDate();
      if (!days[day]) days[day] = [];
      days[day].push(transformCalendarEvent(event));
    });
  }
  
  return { year, month, days };
}

function transformUpcomingEvent(data: any): UpcomingEvent {
  const event = transformCalendarEvent(data.event || data);
  const now = new Date();
  const eventDate = new Date(event.startTime);
  const isToday = eventDate.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();
  
  return {
    event,
    timeUntil: data.time_until || data.timeUntil || formatTimeUntil(eventDate),
    isToday,
    isTomorrow,
  };
}

function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'Now';
}
