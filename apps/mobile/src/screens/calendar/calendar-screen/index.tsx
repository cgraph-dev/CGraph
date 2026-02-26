/**
 * CalendarScreen
 *
 * Full-featured calendar view for events, birthdays, holidays, and reminders.
 *
 * @refactored Extracted from 1105-line file:
 * - types.ts: Types, constants, helper functions
 * - hooks/useCalendar.ts: State and data management
 * - components/DayCell: Individual day cell
 * - components/EventCard: Event display card
 * - components/EventForm: Create/edit modal
 * - components/CalendarGrid: Month grid with headers
 * - components/CalendarHeader: Title and navigation
 * - components/EventsList: Selected date events
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticFeedback, AnimationColors } from '@/lib/animations/animation-engine';
import type { CalendarEvent } from './types';
import { useCalendar } from './hooks/useCalendar';
import { CalendarHeader, CalendarGrid, EventsList, EventForm } from './components';

/**
 *
 */
export default function CalendarScreen() {
  const {
    currentYear,
    currentMonth,
    selectedDate,
    events,
    calendarDays,
    selectedDateEvents,
    refreshing,
    today,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    handleDatePress,
    handleRefresh,
    saveEvent,
  } = useCalendar();

  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

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
    saveEvent(eventData);
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
        <CalendarHeader
          currentMonth={currentMonth}
          currentYear={currentYear}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onCreate={handleCreateEvent}
        />

        <CalendarGrid
          calendarDays={calendarDays}
          events={events}
          selectedDate={selectedDate}
          today={today}
          onDatePress={handleDatePress}
        />

        <EventsList
          selectedDate={selectedDate}
          events={selectedDateEvents}
          onEventPress={handleEventPress}
          onCreateEvent={handleCreateEvent}
        />
      </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
});
