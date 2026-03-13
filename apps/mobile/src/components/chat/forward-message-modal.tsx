/**
 * ForwardMessageModal Component
 *
 * Bottom sheet modal for forwarding messages to one or more conversations.
 * Supports search, multi-select (max 5), and message preview.
 *
 * @module components/chat/ForwardMessageModal
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Message, Conversation } from '../../types';
import api from '../../lib/api';

export interface ForwardMessageModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The message to forward */
  message: Message | null;
  /** List of available conversations */
  conversations: Conversation[];
  /** Whether dark mode is active */
  isDark: boolean;
  /** Theme colors */
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    surface: string;
    input: string;
  };
  /** Callback to close the modal */
  onClose: () => void;
  /** Optional callback on success */
  onSuccess?: (count: number) => void;
}

/**
 * Bottom sheet modal for message forwarding.
 *
 * Features:
 * - Search/filter conversations
 * - Multi-select up to 5 conversations
 * - Message preview at top
 * - Forward via POST /api/v1/messages/:id/forward
 * - Haptic feedback
 */
export function ForwardMessageModal({
  visible,
  message,
  conversations,
  isDark,
  colors,
  onClose,
  onSuccess,
}: ForwardMessageModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = c.name || '';
      return name.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

  const handleToggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < 5) {
          next.add(id);
        }
        return next;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    []
  );

  const handleForward = useCallback(async () => {
    if (!message || selectedIds.size === 0 || isForwarding) return;

    setIsForwarding(true);
    try {
      await api.post(`/api/v1/messages/${message.id}/forward`, {
        conversation_ids: Array.from(selectedIds),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.(selectedIds.size);
      handleClose();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsForwarding(false);
    }
  }, [message, selectedIds, isForwarding, onSuccess]);

  const handleClose = useCallback(() => {
    setSelectedIds(new Set());
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const getMessagePreview = (): string => {
    if (!message) return '';
    if (message.type === 'text') return message.content;
    if (message.type === 'image') return '📷 Photo';
    if (message.type === 'file') return `📎 ${message.metadata?.filename || 'File'}`;
    if (message.type === 'voice' || message.type === 'audio') return '🎤 Voice message';
    if (message.type === 'video') return '🎥 Video';
    return message.content || 'Message';
  };

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <Pressable
          onPress={() => handleToggle(item.id)}
          style={({ pressed }) => [
            styles.conversationItem,
            {
              backgroundColor: isSelected
                ? `${colors.primary}20`
                : pressed
                  ? colors.surface
                  : 'transparent',
              borderColor: isSelected ? colors.primary : colors.border,
            },
          ]}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {(item as any).avatar_url ? (
              <Image source={{ uri: (item as any).avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {(item.name || '?').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Name */}
          <View style={styles.conversationInfo}>
            <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
              {item.name || 'Unknown'}
            </Text>
            <Text style={[styles.conversationType, { color: colors.textSecondary }]}>
              {item.type === 'direct' ? 'Direct message' : 'Group'}
            </Text>
          </View>

          {/* Checkbox */}
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primary : 'transparent',
              },
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </Pressable>
      );
    },
    [selectedIds, colors, handleToggle]
  );

  if (!visible || !message) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 100}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
        </Pressable>

        {/* Bottom sheet content */}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 35, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Forward Message</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Message preview */}
          <View style={[styles.preview, { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.previewLabel, { color: colors.primary }]}>MESSAGE PREVIEW</Text>
            <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={3}>
              {getMessagePreview()}
            </Text>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search conversations..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          {/* Selection count */}
          {selectedIds.size > 0 && (
            <Text style={[styles.selectionCount, { color: colors.primary }]}>
              {selectedIds.size} of 5 selected
            </Text>
          )}

          {/* Conversation list */}
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No conversations found' : 'No conversations available'}
              </Text>
            }
          />

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleClose}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleForward}
              disabled={selectedIds.size === 0 || isForwarding}
              style={[
                styles.forwardBtn,
                {
                  backgroundColor:
                    selectedIds.size > 0 && !isForwarding ? colors.primary : colors.border,
                },
              ]}
            >
              {isForwarding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="arrow-redo" size={18} color="#fff" />
                  <Text style={styles.forwardBtnText}>
                    Forward{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  preview: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  selectionCount: {
    marginHorizontal: 20,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flexGrow: 0,
    maxHeight: 300,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationName: {
    fontSize: 15,
    fontWeight: '600',
  },
  conversationType: {
    fontSize: 12,
    marginTop: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  forwardBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  forwardBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForwardMessageModal;
