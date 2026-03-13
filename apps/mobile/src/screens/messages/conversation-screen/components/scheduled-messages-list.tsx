/**
 * ScheduledMessagesList — Mobile flat list of pending scheduled messages.
 *
 * Loads from GET /api/v1/messages/scheduled?conversation_id=…
 * Supports swipe-to-cancel via gesture handler and tap-to-edit.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import api from '../../../../lib/api';

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

export interface ScheduledMessage {
  id: string;
  content: string;
  scheduled_at: string;
  schedule_status: string;
  conversation_id: string;
}

interface ScheduledMessagesListProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  /** Open the schedule modal to reschedule a specific message */
  onReschedule?: (message: ScheduledMessage) => void;
}

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

function formatScheduledDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'past due';
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return `in ${days}d`;
}

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

/** Description. */
/** Scheduled Messages List component. */
export function ScheduledMessagesList({
  visible,
  onClose,
  conversationId,
  onReschedule,
}: ScheduledMessagesListProps) {
  const { colors } = useThemeStore();

  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // ── Fetch scheduled messages ──────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/messages/scheduled?conversation_id=${conversationId}`);
      const list: ScheduledMessage[] =
        res.data?.data?.messages ?? res.data?.messages ?? res.data ?? [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('[ScheduledMessagesList] fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (visible) {
      fetchMessages();
    }
  }, [visible, fetchMessages]);

  // ── Cancel a scheduled message ────────────────────────
  const handleCancel = useCallback(async (messageId: string) => {
    Alert.alert('Cancel message', 'Are you sure you want to cancel this scheduled message?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Message',
        style: 'destructive',
        onPress: async () => {
          setCancelingId(messageId);
          try {
            await api.delete(`/api/v1/messages/scheduled/${messageId}`);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } catch (err) {
            console.warn('[ScheduledMessagesList] cancel error', err);
            Alert.alert('Error', 'Failed to cancel scheduled message');
          } finally {
            setCancelingId(null);
          }
        },
      },
    ]);
  }, []);

  // ── Swipe-to-cancel right action ──────────────────────
  const renderRightActions = useCallback(
    (messageId: string) => (
      <TouchableOpacity
        style={[ds.swipeAction, { backgroundColor: '#EF4444' }]}
        onPress={() => handleCancel(messageId)}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={ds.swipeActionText}>Cancel</Text>
      </TouchableOpacity>
    ),
    [handleCancel]
  );

  // ── Dynamic styles ────────────────────────────────────
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
        container: {
          flex: 1,
          marginTop: Platform.OS === 'ios' ? 60 : 40,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border ?? '#333',
        },
        headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
        headerCount: { fontSize: 13, color: colors.textSecondary },
        card: {
          marginHorizontal: 16,
          marginVertical: 6,
          backgroundColor: colors.surfaceHover,
          borderRadius: 12,
          padding: 14,
        },
        cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
        cardTime: { fontSize: 14, fontWeight: '600', color: colors.primary },
        cardRelative: { fontSize: 12, color: colors.textSecondary },
        cardDate: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
        cardContent: { fontSize: 14, color: colors.text, lineHeight: 20 },
        cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
        editBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 8,
          backgroundColor: colors.primary + '22',
        },
        editText: { fontSize: 12, color: colors.primary },
        cancelBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 8,
          backgroundColor: '#EF444422',
        },
        cancelText: { fontSize: 12, color: '#EF4444' },
        emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
        emptyIcon: { opacity: 0.5 },
        emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
        emptySubtitle: {
          fontSize: 13,
          color: colors.textSecondary,
          textAlign: 'center',
          paddingHorizontal: 40,
        },
      }),
    [colors]
  );

  // ── Render each card ──────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ScheduledMessage }) => {
      const isBeingCanceled = cancelingId === item.id;

      return (
        <Swipeable renderRightActions={() => renderRightActions(item.id)}>
          <View style={[dynamicStyles.card, isBeingCanceled && { opacity: 0.5 }]}>
            {/* Time row */}
            <View style={dynamicStyles.cardTop}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={dynamicStyles.cardTime}>
                {new Date(item.scheduled_at).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={dynamicStyles.cardRelative}>{relativeTime(item.scheduled_at)}</Text>
            </View>

            <Text style={dynamicStyles.cardDate}>{formatScheduledDate(item.scheduled_at)}</Text>

            {/* Content */}
            <Text style={dynamicStyles.cardContent} numberOfLines={3}>
              {item.content}
            </Text>

            {/* Actions */}
            <View style={dynamicStyles.cardActions}>
              {onReschedule && (
                <TouchableOpacity
                  style={dynamicStyles.editBtn}
                  onPress={() => onReschedule(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                  <Text style={dynamicStyles.editText}>Reschedule</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={dynamicStyles.cancelBtn}
                onPress={() => handleCancel(item.id)}
                disabled={isBeingCanceled}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                <Text style={dynamicStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Swipeable>
      );
    },
    [cancelingId, colors, dynamicStyles, handleCancel, onReschedule, renderRightActions]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.container}>
          {/* Header */}
          <View style={dynamicStyles.headerRow}>
            <View style={dynamicStyles.headerLeft}>
              <Ionicons name="time-outline" size={22} color={colors.primary} />
              <View>
                <Text style={dynamicStyles.headerTitle}>Scheduled Messages</Text>
                <Text style={dynamicStyles.headerCount}>
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'} scheduled
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={dynamicStyles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={dynamicStyles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={colors.textSecondary}
                style={dynamicStyles.emptyIcon}
              />
              <Text style={dynamicStyles.emptyTitle}>No scheduled messages</Text>
              <Text style={dynamicStyles.emptySubtitle}>
                Schedule messages to send them at a specific time
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Static styles ─────────────────────────────────────
const ds = StyleSheet.create({
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  swipeActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ScheduledMessagesList;
