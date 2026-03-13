/**
 * EventsList Component
 *
 * Displays events for the selected date.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimationColors } from '@/lib/animations/animation-engine';
import type { CalendarEvent } from '../types';
import { EventCard } from './event-card';

interface EventsListProps {
  selectedDate: Date | null;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
  onCreateEvent: () => void;
}

/**
 * Events List component.
 *
 */
export function EventsList({ selectedDate, events, onEventPress, onCreateEvent }: EventsListProps) {
  if (!selectedDate) return null;

  return (
    <View style={styles.eventsSection}>
      <Text style={styles.eventsSectionTitle}>
        {selectedDate.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </Text>

      {events.length === 0 ? (
        <View style={styles.noEvents}>
          <Ionicons name="calendar-outline" size={48} color="#4b5563" />
          <Text style={styles.noEventsText}>No events</Text>
          <TouchableOpacity onPress={onCreateEvent}>
            <Text style={styles.noEventsAction}>Add an event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} onPress={onEventPress} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
