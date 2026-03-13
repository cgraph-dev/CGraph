/**
 * EventForm Component
 *
 * Modal form for creating and editing calendar events.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, AnimationColors } from '@/lib/animations/animation-engine';
import { EVENT_TYPE_CONFIG } from '../types';
import type { CalendarEvent, EventType } from '../types';

interface EventFormProps {
  visible: boolean;
  event?: CalendarEvent | null;
  initialDate?: Date;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
}

/**
 * Event Form component.
 *
 */
export function EventForm({ visible, event, initialDate, onClose, onSave }: EventFormProps) {
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
              {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */}
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
                      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any
                      name={config.icon as any}
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

const styles = StyleSheet.create({
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
