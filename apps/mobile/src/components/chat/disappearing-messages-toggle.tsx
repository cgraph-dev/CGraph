/**
 * DisappearingMessagesToggle - Mobile bottom sheet for ephemeral message settings
 *
 * Provides options to set message TTL (time-to-live) for a conversation.
 * Matches the web version with native mobile patterns.
 *
 * @module components/chat
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';

const TTL_OPTIONS = [
  { label: 'Off', value: null, description: 'Messages are kept permanently' },
  { label: '24 hours', value: 86400, description: 'Messages disappear after 1 day' },
  { label: '7 days', value: 604800, description: 'Messages disappear after 1 week' },
  { label: '30 days', value: 2592000, description: 'Messages disappear after 1 month' },
] as const;

interface DisappearingMessagesToggleProps {
  /** The conversation ID to set TTL for */
  conversationId: string;
  /** Current TTL in seconds, null = off */
  currentTTL: number | null;
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when TTL is updated */
  onUpdate?: (ttl: number | null) => void;
}

/**
 * Mobile bottom sheet for configuring disappearing messages.
 */
export function DisappearingMessagesToggle({
  conversationId,
  currentTTL,
  isOpen,
  onClose,
  onUpdate,
}: DisappearingMessagesToggleProps) {
  const { colors } = useThemeStore();
  const [selectedTTL, setSelectedTTL] = useState<number | null>(currentTTL);
  const [saving, setSaving] = useState(false);

  const handleSelect = useCallback(
    async (ttl: number | null) => {
      if (saving) return;
      setSaving(true);
      try {
        await api.put(`/api/v1/conversations/${conversationId}/ttl`, { ttl });
        setSelectedTTL(ttl);
        onUpdate?.(ttl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setSaving(false);
      }
    },
    [conversationId, saving, onUpdate, onClose]
  );

  const currentOption = TTL_OPTIONS.find((o) => o.value === selectedTTL) ?? TTL_OPTIONS[0];

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={modalStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            modalStyles.sheet,
            { backgroundColor: colors.surface || '#1a1a2e' },
          ]}
        >
          {/* Handle */}
          <View style={[modalStyles.handle, { backgroundColor: colors.border || '#333' }]} />

          {/* Header */}
          <View style={modalStyles.header}>
            <Ionicons name="timer-outline" size={24} color={colors.primary} />
            <Text style={[modalStyles.title, { color: colors.text }]}>
              Disappearing Messages
            </Text>
          </View>

          <Text style={[modalStyles.subtitle, { color: colors.textSecondary }]}>
            When enabled, new messages will automatically disappear after the selected time period.
          </Text>

          {/* Options */}
          <View style={modalStyles.optionsList}>
            {TTL_OPTIONS.map((option) => {
              const isSelected = currentOption.value === option.value;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    modalStyles.optionItem,
                    {
                      backgroundColor: isSelected
                        ? `${colors.primary}15`
                        : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.border || '#333',
                    },
                  ]}
                  onPress={() => handleSelect(option.value)}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  <View style={modalStyles.optionContent}>
                    <Text
                      style={[
                        modalStyles.optionLabel,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        modalStyles.optionDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cancel */}
          <TouchableOpacity
            style={[modalStyles.cancelButton, { backgroundColor: colors.border || '#333' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[modalStyles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  optionsList: {
    gap: 8,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
  },
  cancelButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DisappearingMessagesToggle;
