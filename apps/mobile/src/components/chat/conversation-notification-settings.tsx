/**
 * ConversationNotificationSettings - Mobile Bottom Sheet
 *
 * Bottom sheet for managing per-conversation notification preferences.
 * Matches functionality of web version with native mobile patterns.
 *
 * @module components/chat
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import apiClient from '@/services/api';

type NotificationMode = 'all' | 'mentions_only' | 'none';

interface NotificationPreference {
  mode: NotificationMode;
  muted_until?: string | null;
  mutedUntil?: string | null;
}

interface ConversationNotificationSettingsProps {
  conversationId: string;
  targetType?: 'conversation' | 'channel' | 'group';
  isOpen: boolean;
  onClose: () => void;
}

const MODE_OPTIONS: {
  value: NotificationMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'all',
    label: 'All messages',
    description: 'Get notified for every message',
    icon: 'notifications',
  },
  {
    value: 'mentions_only',
    label: 'Mentions only',
    description: 'Only get notified when mentioned',
    icon: 'at',
  },
  {
    value: 'none',
    label: 'Mute',
    description: 'No notifications from this conversation',
    icon: 'notifications-off',
  },
];

const MUTE_DURATIONS = [
  { label: '1 hour', seconds: 3600 },
  { label: '8 hours', seconds: 28800 },
  { label: '24 hours', seconds: 86400 },
  { label: '1 week', seconds: 604800 },
  { label: 'Forever', seconds: null },
] as const;

/** Description. */
/** Conversation Notification Settings component. */
export function ConversationNotificationSettings({
  conversationId,
  targetType = 'conversation',
  isOpen,
  onClose,
}: ConversationNotificationSettingsProps) {
  const { colors } = useThemeStore();
  const [currentMode, setCurrentMode] = useState<NotificationMode>('all');
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDurations, setShowDurations] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPreference = async () => {
      try {
        const res = await apiClient.get<{ data: { preference: NotificationPreference } }>(
          `/api/v1/notification-preferences/${targetType}/${conversationId}`
        );
        const pref =
          res.data?.data?.preference ??
           
          (res.data as unknown as { preference: NotificationPreference })?.preference;
        if (pref) {
          setCurrentMode(pref.mode || 'all');
          setMutedUntil(pref.mutedUntil ?? pref.muted_until ?? null);
        }
      } catch {
        setCurrentMode('all');
      }
    };

    fetchPreference();
  }, [isOpen, conversationId, targetType]);

  const updatePreference = useCallback(
    async (mode: NotificationMode, muteUntil?: string | null) => {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        if (mode === 'all') {
          await apiClient.delete(
            `/api/v1/notification-preferences/${targetType}/${conversationId}`
          );
        } else {
          await apiClient.put(`/api/v1/notification-preferences/${targetType}/${conversationId}`, {
            mode,
            muted_until: muteUntil ?? null,
          });
        }
        setCurrentMode(mode);
        setMutedUntil(muteUntil ?? null);
        setShowDurations(false);
      } catch (err) {
        console.error('Failed to update notification preference:', err);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, targetType]
  );

  const handleModeSelect = useCallback(
    (mode: NotificationMode) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (mode === 'none') {
        setShowDurations(true);
      } else {
        updatePreference(mode);
      }
    },
    [updatePreference]
  );

  const handleMuteDuration = useCallback(
    (seconds: number | null) => {
      const muteUntil = seconds ? new Date(Date.now() + seconds * 1000).toISOString() : null;
      updatePreference('none', muteUntil);
    },
    [updatePreference]
  );

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
              Notifications
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Muted status */}
          {mutedUntil && currentMode === 'none' && (
            <View
              style={{
                backgroundColor: 'rgba(245,158,11,0.1)',
                borderRadius: 8,
                padding: 10,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 13, color: '#f59e0b' }}>
                Muted until {new Date(mutedUntil).toLocaleString()}
              </Text>
            </View>
          )}

          {loading && <ActivityIndicator style={{ marginVertical: 12 }} color={colors.primary} />}

          {/* Duration picker */}
          {showDurations ? (
            <View>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
                Mute for how long?
              </Text>
              {MUTE_DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.label}
                  onPress={() => handleMuteDuration(d.seconds)}
                  disabled={loading}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 16, color: colors.text }}>{d.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setShowDurations(false)}
                style={{ paddingVertical: 14, paddingHorizontal: 12, marginTop: 4 }}
              >
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {MODE_OPTIONS.map((option) => {
                const isSelected = currentMode === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleModeSelect(option.value)}
                    disabled={loading}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      marginBottom: 4,
                      backgroundColor: isSelected ? `${colors.primary}20` : 'transparent',
                    }}
                  >
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={isSelected ? colors.primary : colors.textSecondary}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: isSelected ? colors.primary : colors.text,
                        }}
                      >
                        {option.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        {option.description}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default ConversationNotificationSettings;
