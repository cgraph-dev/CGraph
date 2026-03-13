/**
 * EventCard Component
 *
 * Displays a calendar event with icon, time, and location.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { EVENT_TYPE_CONFIG, formatTime } from '../types';
import type { CalendarEvent } from '../types';

interface EventCardProps {
  event: CalendarEvent;
  onPress: (event: CalendarEvent) => void;
}

/**
 *
 */
export function EventCard({ event, onPress }: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const color = event.color || config.color;

  return (
    <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.8}>
      <BlurView intensity={40} tint="dark" style={styles.eventCard}>
        <View style={[styles.eventColorBar, { backgroundColor: color }]} />
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventIcon, { backgroundColor: color + '30' }]}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Ionicons name={config.icon as any} size={16} color={color} />
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

const styles = StyleSheet.create({
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
});
