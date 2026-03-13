/**
 * ScheduleMessageModal — Mobile bottom sheet for scheduling messages.
 *
 * Provides quick-schedule options (Later today, Tomorrow morning, Monday, Custom)
 * plus a date/time picker. On confirm, calls POST /api/v1/messages/scheduled.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import api from '../../../../lib/api';

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

export interface ScheduleMessageModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  messageContent: string;
  /** Called after successful scheduling so the parent can clear the input */
  onScheduled?: () => void;
}

interface QuickOption {
  label: string;
  icon: string;
  resolve: () => Date;
}

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

function laterToday(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  return d;
}

function tomorrowMorning(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function nextMonday(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun … 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(9, 0, 0, 0);
  return d;
}

const QUICK_OPTIONS: QuickOption[] = [
  { label: 'Later today', icon: 'time-outline', resolve: laterToday },
  { label: 'Tomorrow morning', icon: 'sunny-outline', resolve: tomorrowMorning },
  { label: 'Next Monday', icon: 'calendar-outline', resolve: nextMonday },
];

function formatPreview(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

/** Description. */
/** Schedule Message Modal component. */
export function ScheduleMessageModal({
  visible,
  onClose,
  conversationId,
  messageContent,
  onScheduled,
}: ScheduleMessageModalProps) {
  const { colors } = useThemeStore();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date>(laterToday());
  const [isSending, setIsSending] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedDate(null);
      setShowDatePicker(false);
      setShowTimePicker(false);
      setCustomDate(laterToday());
      setIsSending(false);
    }
  }, [visible]);

  // ── Quick option tap ──────────────────────────────────
  const handleQuickOption = useCallback((option: QuickOption) => {
    const date = option.resolve();
    setSelectedDate(date);
    setCustomDate(date);
  }, []);

  // ── Custom date/time pickers ──────────────────────────
  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setShowDatePicker(false);
      if (date) {
        const merged = new Date(date);
        merged.setHours(customDate.getHours(), customDate.getMinutes(), 0, 0);
        setCustomDate(merged);
        setSelectedDate(merged);
        // On Android, open time picker right after date is chosen
        if (Platform.OS === 'android') {
          setTimeout(() => setShowTimePicker(true), 300);
        }
      }
    },
    [customDate]
  );

  const handleTimeChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setShowTimePicker(false);
      if (date) {
        const merged = new Date(customDate);
        merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setCustomDate(merged);
        setSelectedDate(merged);
      }
    },
    [customDate]
  );

  const openCustomPicker = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  // ── Schedule confirm ──────────────────────────────────
  const handleSchedule = useCallback(async () => {
    if (!selectedDate || isSending) return;

    if (selectedDate <= new Date()) {
      Alert.alert('Invalid time', 'Scheduled time must be in the future.');
      return;
    }

    setIsSending(true);
    try {
      await api.post(`/api/v1/messages/scheduled`, {
        message: {
          content: messageContent,
          conversation_id: conversationId,
          scheduled_at: selectedDate.toISOString(),
          content_type: 'text',
        },
      });
      onScheduled?.();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule message';
      Alert.alert('Scheduling failed', errorMessage);
    } finally {
      setIsSending(false);
    }
  }, [selectedDate, isSending, messageContent, conversationId, onScheduled, onClose]);

  // ── Minimum date (now) ────────────────────────────────
  const minDate = useMemo(() => new Date(), []);

  // ── Styles ────────────────────────────────────────────
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          paddingHorizontal: 20,
          paddingTop: 16,
          maxHeight: '75%',
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border ?? '#555',
          marginBottom: 12,
        },
        title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
        subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
        preview: {
          backgroundColor: colors.surfaceHover,
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        },
        previewLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
        previewText: { fontSize: 14, color: colors.text, lineHeight: 20 },
        quickLabel: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: 8,
        },
        quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
        quickBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: colors.surfaceHover,
        },
        quickBtnActive: {
          backgroundColor: colors.primary + '33',
          borderWidth: 1,
          borderColor: colors.primary,
        },
        quickBtnText: { fontSize: 14, color: colors.text },
        customBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border ?? '#444',
          marginBottom: 16,
        },
        customBtnText: { fontSize: 14, color: colors.primary },
        selectedContainer: {
          backgroundColor: colors.primary + '1A',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          alignItems: 'center',
        },
        selectedLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
        selectedDate: { fontSize: 16, fontWeight: '600', color: colors.primary },
        actionRow: { flexDirection: 'row', gap: 12 },
        cancelBtn: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: colors.surfaceHover,
        },
        cancelText: { fontSize: 16, fontWeight: '600', color: colors.text },
        scheduleBtn: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: colors.primary,
        },
        scheduleBtnDisabled: { opacity: 0.5 },
        scheduleText: { fontSize: 16, fontWeight: '600', color: '#fff' },
      }),
    [colors]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.sheet}>
          {/* Handle bar */}
          <View style={dynamicStyles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Text style={dynamicStyles.title}>Schedule Message</Text>
            <Text style={dynamicStyles.subtitle}>Choose when to send this message</Text>

            {/* Message preview */}
            <View style={dynamicStyles.preview}>
              <Text style={dynamicStyles.previewLabel}>Message Preview:</Text>
              <Text style={dynamicStyles.previewText} numberOfLines={3}>
                {messageContent}
              </Text>
            </View>

            {/* Quick schedule options */}
            <Text style={dynamicStyles.quickLabel}>Quick Schedule:</Text>
            <View style={dynamicStyles.quickRow}>
              {QUICK_OPTIONS.map((opt) => {
                const resolved = opt.resolve();
                const isActive =
                  selectedDate && Math.abs(selectedDate.getTime() - resolved.getTime()) < 60_000;

                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[dynamicStyles.quickBtn, isActive && dynamicStyles.quickBtnActive]}
                    onPress={() => handleQuickOption(opt)}
                    activeOpacity={0.7}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */}
                    <Ionicons name={opt.icon as any} size={18} color={colors.primary} />
                    <Text style={dynamicStyles.quickBtnText}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom date / time */}
            <TouchableOpacity
              style={dynamicStyles.customBtn}
              onPress={openCustomPicker}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={18} color={colors.primary} />
              <Text style={dynamicStyles.customBtnText}>Pick custom date & time</Text>
            </TouchableOpacity>

            {/* Native date picker (iOS inline, Android dialog) */}
            {showDatePicker && (
              <DateTimePicker
                value={customDate}
                mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={minDate}
                onChange={
                  Platform.OS === 'ios'
                    ? (_e, d) => {
                        if (d) {
                          setCustomDate(d);
                          setSelectedDate(d);
                        }
                      }
                    : handleDateChange
                }
                themeVariant="dark"
              />
            )}

            {showTimePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={customDate}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Selected time preview */}
            {selectedDate && (
              <View style={dynamicStyles.selectedContainer}>
                <Text style={dynamicStyles.selectedLabel}>Scheduled for:</Text>
                <Text style={dynamicStyles.selectedDate}>{formatPreview(selectedDate)}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action row */}
          <View style={dynamicStyles.actionRow}>
            <TouchableOpacity style={dynamicStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={dynamicStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                dynamicStyles.scheduleBtn,
                (!selectedDate || isSending) && dynamicStyles.scheduleBtnDisabled,
              ]}
              onPress={handleSchedule}
              disabled={!selectedDate || isSending}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.scheduleText}>
                {isSending ? 'Scheduling…' : 'Schedule'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ScheduleMessageModal;
