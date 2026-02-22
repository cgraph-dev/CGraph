/**
 * CalendarHeader Component
 *
 * Header with title, add button, and month navigation.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnimationColors } from '@/lib/animations/animation-engine';
import { MONTHS } from '../types';

interface CalendarHeaderProps {
  currentMonth: number;
  currentYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCreate: () => void;
}

export function CalendarHeader({
  currentMonth,
  currentYear,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onCreate,
}: CalendarHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.titleRow}>
          <Ionicons name="calendar" size={28} color={AnimationColors.primary} />
          <Text style={styles.title}>Calendar</Text>
        </View>
        <TouchableOpacity onPress={onCreate} style={styles.addButton}>
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
        <TouchableOpacity onPress={onPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.monthYear}>
          {MONTHS[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
