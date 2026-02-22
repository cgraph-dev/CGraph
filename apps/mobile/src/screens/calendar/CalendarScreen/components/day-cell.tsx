/**
 * DayCell Component
 *
 * Individual day cell in the calendar grid showing date and event indicators.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { AnimationColors } from '@/lib/animations/animation-engine';
import type { CalendarEvent } from '../types';
import { EVENT_TYPE_CONFIG } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 32) / 7;

interface DayCellProps {
  date: Date | null;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onPress: (date: Date) => void;
}

export function DayCell({ date, isToday, isSelected, events, onPress }: DayCellProps) {
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

const styles = StyleSheet.create({
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
});
