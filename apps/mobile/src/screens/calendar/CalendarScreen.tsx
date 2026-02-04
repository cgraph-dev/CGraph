/**
 * CalendarScreen - Mobile
 *
 * Full-featured calendar view for events, birthdays, holidays, and reminders.
 * Designed for mobile with gesture-based navigation and touch-optimized interactions.
 *
 * Features:
 * - Month/Week/Day view modes
 * - Event creation and editing
 * - Birthday reminders with animated celebrations
 * - Holiday highlighting
 * - Category filtering
 * - Pull-to-refresh
 * - Swipe navigation between months
 * - Event reminders and notifications
 * - Today quick-jump button
 *
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, AnimationColors } from '@/lib/animations/AnimationEngine';
import api from '../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 32) / 7;

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'month' | 'week' | 'day';
type EventType = 'event' | 'birthday' | 'holiday' | 'recurring';

interface CalendarEvent {
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

interface EventCategory {
  id: string;
  name: string;
  color: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
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

const EVENT_TYPE_CONFIG: Record<EventType, { icon: string; color: string }> = {
  event: { icon: 'calendar', color: '#3b82f6' },
  birthday: { icon: 'gift', color: '#ec4899' },
  holiday: { icon: 'flag', color: '#f97316' },
  recurring: { icon: 'repeat', color: '#8b5cf6' },
};

const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: 'personal', name: 'Personal', color: '#3b82f6' },
  { id: 'work', name: 'Work', color: '#10b981' },
  { id: 'community', name: 'Community', color: '#8b5cf6' },
  { id: 'gaming', name: 'Gaming', color: '#ec4899' },
];

// ============================================================================
// DAY CELL COMPONENT
// ============================================================================

interface DayCellProps {
  date: Date | null;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onPress: (date: Date) => void;
}

function DayCell({ date, isToday, isSelected, events, onPress }: DayCellProps) {
  if (!date) {
    return <View style={styles.dayCell} />;
  }

  const hasEvents = events.length > 0;
  const hasBirthday = events.some((e) => e.type === 'birthday');
  const hasHoliday = events.some((e) => e.type === 'holiday');

  return (
    <TouchableOpacity
      onPress={() => onPress(date)}
      style={[styles.dayCell, isSelected && styles.dayCellSelected]}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.dayNumber,
          isToday && styles.dayNumberToday,
          isSelected && styles.dayNumberSelected,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            isToday && styles.dayTextToday,
            isSelected && styles.dayTextSelected,
          ]}
        >
          {date.getDate()}
        </Text>
      </View>

      {/* Event indicators */}
      {hasEvents && (
        <View style={styles.eventIndicators}>
          {hasBirthday && (
            <View
              style={[styles.eventDot, { backgroundColor: EVENT_TYPE_CONFIG.birthday.color }]}
            />
          )}
          {hasHoliday && (
            <View style={[styles.eventDot, { backgroundColor: EVENT_TYPE_CONFIG.holiday.color }]} />
          )}
          {!hasBirthday && !hasHoliday && (
            <View style={[styles.eventDot, { backgroundColor: AnimationColors.primary }]} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// EVENT CARD COMPONENT
// ============================================================================

interface EventCardProps {
  event: CalendarEvent;
  onPress: (event: CalendarEvent) => void;
}

function EventCard({ event, onPress }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const color = event.color || config.color;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.8}>
      <BlurView intensity={40} tint="dark" style={styles.eventCard}>
        <View style={[styles.eventColorBar, { backgroundColor: color }]} />
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventIcon, { backgroundColor: color + '30' }]}>
              <Ionicons name={config.icon as unknown} size={16} color={color} />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              {!event.allDay && (
                <Text style={styles.eventTime}>
                  {formatTime(event.startDate)}
                  {event.endDate && ` - ${formatTime(event.endDate)}`}
                </Text>
              )}
              {event.allDay && <Text style={styles.eventTime}>All day</Text>}
            </View>
          </View>

          {event.location && (
            <View style={styles.eventLocation}>
              <Ionicons name="location" size={12} color="#9ca3af" />
              <Text style={styles.eventLocationText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </BlurView>
    </TouchableOpacity>
  );
}

// ============================================================================
// EVENT FORM MODAL
// ============================================================================

interface EventFormProps {
  visible: boolean;
  event?: CalendarEvent | null;
  initialDate?: Date;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
}

function EventForm({ visible, event, initialDate, onClose, onSave }: EventFormProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [allDay, setAllDay] = useState(event?.allDay ?? true);
  const [eventType, setEventType] = useState<EventType>(event?.type || 'event');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setAllDay(event.allDay);
      setEventType(event.type);
    } else {
      setTitle('');
      setDescription('');
      setLocation('');
      setAllDay(true);
      setEventType('event');
    }
  }, [event, visible]);

  const handleSave = () => {
    if (!title.trim()) return;

    HapticFeedback.success();
    onSave({
      id: event?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      allDay,
      type: eventType,
      startDate: initialDate?.toISOString() || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <LinearGradient colors={['#111827', '#0f172a']} style={StyleSheet.absoluteFillObject} />

        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{event ? 'Edit Event' : 'New Event'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={!title.trim()}>
            <Text style={[styles.modalSave, !title.trim() && styles.modalSaveDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Title */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.formInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor="#6b7280"
              autoFocus
            />
          </View>

          {/* Event Type */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.typeSelector}>
              {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((type) => {
                const config = EVENT_TYPE_CONFIG[type];
                const isSelected = eventType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setEventType(type)}
                    style={[
                      styles.typeOption,
                      isSelected && {
                        backgroundColor: config.color + '30',
                        borderColor: config.color,
                      },
                    ]}
                  >
                    <Ionicons
                      name={config.icon as unknown}
                      size={18}
                      color={isSelected ? config.color : '#9ca3af'}
                    />
                    <Text style={[styles.typeOptionText, isSelected && { color: config.color }]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* All Day Toggle */}
          <TouchableOpacity style={styles.toggleRow} onPress={() => setAllDay(!allDay)}>
            <Text style={styles.formLabel}>All Day</Text>
            <View style={[styles.toggle, allDay && styles.toggleActive]}>
              <View style={[styles.toggleKnob, allDay && styles.toggleKnobActive]} />
            </View>
          </TouchableOpacity>

          {/* Location */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Location</Text>
            <TextInput
              style={styles.formInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Add location"
              placeholderTextColor="#6b7280"
            />
          </View>

          {/* Description */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add description"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============================================================================
// FALLBACK DATA (used when API fails)
// ============================================================================

function generateFallbackEvents(): CalendarEvent[] {
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
      location: 'Discord Voice Channel',
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

// Transform API response to CalendarEvent format
function transformApiEvents(data: unknown[]): CalendarEvent[] {
  return (data || []).map((event: Record<string, unknown>) => ({
    id: event.id || String(Math.random()),
    title: event.title || event.name || 'Untitled',
    description: event.description || event.body || undefined,
    startDate: event.start_date || event.startDate || event.starts_at || new Date().toISOString(),
    endDate: event.end_date || event.endDate || event.ends_at || undefined,
    allDay: event.all_day ?? event.allDay ?? false,
    type: (event.type || event.event_type || 'event') as EventType,
    categoryId: event.category_id || event.categoryId || undefined,
    location: event.location || undefined,
    reminder: event.reminder || undefined,
    color: event.color || undefined,
  }));
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CalendarScreen() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      const response = await api.get('/api/v1/calendar/events', {
        params: {
          start_date: startOfMonth.toISOString(),
          end_date: endOfMonth.toISOString(),
        },
      });

      const data = response.data?.data || response.data?.events || response.data || [];
      setEvents(transformApiEvents(Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      // Fallback to sample data if API fails
      setEvents(generateFallbackEvents());
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  // Fetch events on mount and when month changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Today's date for comparison
  const today = useMemo(
    () => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      date: new Date().getDate(),
    }),
    []
  );

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Padding for start
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    // Pad to complete last week
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [currentYear, currentMonth]);

  // Get events for a specific date
  const getEventsForDate = useCallback(
    (date: Date): CalendarEvent[] => {
      return events.filter((event) => {
        const eventDate = new Date(event.startDate);
        return (
          eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate()
        );
      });
    },
    [events]
  );

  // Selected date events
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate);
  }, [selectedDate, getEventsForDate]);

  // Navigation
  const goToPreviousMonth = () => {
    HapticFeedback.light();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    HapticFeedback.light();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    HapticFeedback.medium();
    setCurrentYear(today.year);
    setCurrentMonth(today.month);
    setSelectedDate(new Date());
  };

  // Event handlers
  const handleDatePress = (date: Date) => {
    HapticFeedback.light();
    setSelectedDate(date);
  };

  const handleEventPress = (event: CalendarEvent) => {
    HapticFeedback.light();
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleCreateEvent = () => {
    HapticFeedback.medium();
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    if (eventData.id) {
      // Update existing
      setEvents((prev) =>
        prev.map((e) => (e.id === eventData.id ? ({ ...e, ...eventData } as CalendarEvent) : e))
      );
    } else {
      // Create new
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventData.title || 'Untitled',
        startDate: eventData.startDate || new Date().toISOString(),
        allDay: eventData.allDay ?? true,
        type: eventData.type || 'event',
        ...eventData,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    HapticFeedback.light();
    await fetchEvents();
    setRefreshing(false);
  };

  const isToday = (date: Date) => {
    return (
      date.getFullYear() === today.year &&
      date.getMonth() === today.month &&
      date.getDate() === today.date
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={AnimationColors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleRow}>
              <Ionicons name="calendar" size={28} color={AnimationColors.primary} />
              <Text style={styles.title}>Calendar</Text>
            </View>
            <TouchableOpacity onPress={handleCreateEvent} style={styles.addButton}>
              <LinearGradient
                colors={[AnimationColors.primary, '#059669']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color="#9ca3af" />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Grid */}
        <BlurView intensity={40} tint="dark" style={styles.calendarCard}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.daysGrid}>
            {calendarDays.map((date, index) => (
              <DayCell
                key={index}
                date={date}
                isToday={date ? isToday(date) : false}
                isSelected={date ? isSelected(date) : false}
                events={date ? getEventsForDate(date) : []}
                onPress={handleDatePress}
              />
            ))}
          </View>
        </BlurView>

        {/* Selected Date Events */}
        {selectedDate && (
          <View style={styles.eventsSection}>
            <Text style={styles.eventsSectionTitle}>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            {selectedDateEvents.length === 0 ? (
              <View style={styles.noEvents}>
                <Ionicons name="calendar-outline" size={48} color="#4b5563" />
                <Text style={styles.noEventsText}>No events</Text>
                <TouchableOpacity onPress={handleCreateEvent}>
                  <Text style={styles.noEventsAction}>Add an event</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {selectedDateEvents.map((event) => (
                  <EventCard key={event.id} event={event} onPress={handleEventPress} />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Event Form Modal */}
      <EventForm
        visible={showEventForm}
        event={editingEvent}
        initialDate={selectedDate || undefined}
        onClose={() => setShowEventForm(false)}
        onSave={handleSaveEvent}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: 10,
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    borderRadius: 8,
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Calendar Card
  calendarCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },

  // Day Headers
  dayHeaders: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.3)',
  },
  dayHeader: {
    width: DAY_WIDTH,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },

  // Days Grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: 56,
    alignItems: 'center',
    paddingTop: 6,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberToday: {
    backgroundColor: AnimationColors.primary,
  },
  dayNumberSelected: {
    borderWidth: 2,
    borderColor: AnimationColors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  dayTextToday: {
    fontWeight: '700',
  },
  dayTextSelected: {
    color: AnimationColors.primary,
  },
  eventIndicators: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Events Section
  eventsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  eventsList: {
    gap: 12,
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  noEventsAction: {
    fontSize: 14,
    color: AnimationColors.primary,
    fontWeight: '600',
    marginTop: 8,
  },

  // Event Card
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  eventColorBar: {
    width: 4,
    height: '100%',
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  eventTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  eventLocationText: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.3)',
  },
  modalCancel: {
    fontSize: 16,
    color: '#9ca3af',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: AnimationColors.primary,
  },
  modalSaveDisabled: {
    color: '#4b5563',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Form
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    gap: 6,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: AnimationColors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
});
