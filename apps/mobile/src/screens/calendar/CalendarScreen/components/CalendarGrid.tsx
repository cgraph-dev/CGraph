/**
 * CalendarGrid Component
 *
 * Displays the month calendar grid with day headers and day cells.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import type { CalendarEvent } from '../types';
import { DAYS, getEventsForDate } from '../types';
import { DayCell } from './DayCell';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 32) / 7;

interface CalendarGridProps {
  calendarDays: (Date | null)[];
  events: CalendarEvent[];
  selectedDate: Date | null;
  today: { year: number; month: number; date: number };
  onDatePress: (date: Date) => void;
}

export function CalendarGrid({
  calendarDays,
  events,
  selectedDate,
  today,
  onDatePress,
}: CalendarGridProps) {
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
            events={date ? getEventsForDate(events, date) : []}
            onPress={onDatePress}
          />
        ))}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
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
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
