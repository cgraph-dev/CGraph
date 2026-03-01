/**
 * MessageActionsMenu Component
 *
 * Full-featured message action modal with preview,
 * quick reactions, and action items.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import type { Message } from '../../../../types';
import { styles } from '../styles';
import { QUICK_REACTIONS } from '../hooks/useReactions';
import api from '../../../../lib/api';

interface ActionItem {
  id: string;
  icon: string;
  label: string;
  color: string;
  gradient: string[];
  onPress: () => void;
  visible: boolean;
  danger?: boolean;
}

interface MessageActionsMenuProps {
  visible: boolean;
  selectedMessage: Message | null;
  isOwnMessage: boolean;
  isDark: boolean;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    surfaceHover: string;
    border: string;
  };
  messageActionsAnim: Animated.Value;
  backdropAnim: Animated.Value;
  menuScaleAnim: Animated.Value;
  actionItemAnims: Animated.Value[];
  onClose: () => void;
  onReply: () => void;
  onEdit: () => void;
  onTogglePin: () => void;
  onUnsend: () => void;
  onQuickReaction: (emoji: string) => void;
  onOpenReactionPicker: () => void;
  getReactionState: (emoji: string) => boolean;
}

/**
 * Modern iOS-style message action menu with blur backdrop.
 */
export function MessageActionsMenu({
  visible,
  selectedMessage,
  isOwnMessage,
  isDark,
  colors,
  messageActionsAnim,
  backdropAnim,
  menuScaleAnim,
  actionItemAnims,
  onClose,
  onReply,
  onEdit,
  onTogglePin,
  onUnsend,
  onQuickReaction,
  onOpenReactionPicker,
  getReactionState,
}: MessageActionsMenuProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Check saved state when menu opens
  useEffect(() => {
    if (!visible || !selectedMessage) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/v1/saved-messages');
        const found = (data.data || []).find(
          (s: { message_id: string; id: string }) => s.message_id === selectedMessage.id
        );
        if (!cancelled) {
          setIsSaved(!!found);
          setSavedId(found?.id ?? null);
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [visible, selectedMessage]);

  const handleToggleSave = useCallback(async () => {
    if (saving || !selectedMessage) return;
    setSaving(true);
    try {
      if (isSaved && savedId) {
        await api.delete(`/api/v1/saved-messages/${savedId}`);
        setIsSaved(false);
        setSavedId(null);
      } else {
        const { data } = await api.post('/api/v1/saved-messages', { message_id: selectedMessage.id });
        setIsSaved(true);
        setSavedId(data.data?.id ?? null);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
    onClose();
  }, [isSaved, savedId, saving, selectedMessage, onClose]);

  if (!visible || !selectedMessage) return null;

  const isPinned = selectedMessage.is_pinned;

  // Build action items
  const actionItems: ActionItem[] = [
    {
      id: 'reply',
      icon: 'arrow-undo',
      label: 'Reply',
      color: '#3b82f6',
      gradient: ['#3b82f6', '#60a5fa'],
      onPress: onReply,
      visible: true,
    },
    {
      id: 'edit',
      icon: 'create-outline',
      label: 'Edit',
      color: '#f59e0b',
      gradient: ['#f59e0b', '#fbbf24'],
      onPress: onEdit,
      visible: isOwnMessage && !selectedMessage.is_deleted && !selectedMessage.deleted_at,
    },
    {
      id: 'copy',
      icon: 'copy-outline',
      label: 'Copy',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#a78bfa'],
      onPress: async () => {
        if (selectedMessage.content) {
          await Clipboard.setStringAsync(selectedMessage.content);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onClose();
      },
      visible: !!selectedMessage.content,
    },
    {
      id: 'pin',
      icon: isPinned ? 'pin-outline' : 'pin',
      label: isPinned ? 'Unpin' : 'Pin',
      color: isPinned ? '#f59e0b' : '#10b981',
      gradient: isPinned ? ['#f59e0b', '#fbbf24'] : ['#10b981', '#34d399'],
      onPress: onTogglePin,
      visible: true,
    },
    {
      id: 'save',
      icon: isSaved ? 'bookmark' : 'bookmark-outline',
      label: isSaved ? 'Unsave' : 'Save',
      color: '#6366f1',
      gradient: ['#6366f1', '#818cf8'],
      onPress: handleToggleSave,
      visible: true,
    },
    {
      id: 'delete',
      icon: 'trash-outline',
      label: 'Unsend',
      color: '#ef4444',
      gradient: ['#ef4444', '#f87171'],
      onPress: onUnsend,
      visible: isOwnMessage,
      danger: true,
    },
  ].filter((item) => item.visible);

  const slideUp = messageActionsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Render a pressable action item with animation
  const renderActionItem = (item: ActionItem, index: number) => {
    const itemAnim = actionItemAnims[index] || new Animated.Value(1);
    const translateY = itemAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    });
    const itemOpacity = itemAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        key={item.id}
        style={{
          transform: [{ translateY }],
          opacity: itemOpacity,
        }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            item.onPress();
          }}
          style={({ pressed }) => [
            styles.modernActionItem,
            {
              backgroundColor: pressed
                ? item.danger
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.04)',
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <View style={[styles.modernActionIconWrap, { backgroundColor: `${item.color}18` }]}>
            <Ionicons
               
              name={item.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={item.color}
            />
          </View>
          <Text
            style={[styles.modernActionLabel, { color: item.danger ? item.color : colors.text }]}
          >
            {item.label}
          </Text>
          <View style={styles.modernActionArrow}>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modernActionsOverlay}>
        {/* Animated blur backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 100}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
            onPress={onClose}
          />
        </Animated.View>

        {/* Centered content area */}
        <View style={styles.modernActionsContent}>
          {/* Message Preview Card */}
          <Animated.View
            style={[
              styles.modernMessagePreview,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                transform: [{ translateY: slideUp }, { scale: menuScaleAnim }],
                opacity: backdropOpacity,
              },
            ]}
          >
            <MessagePreviewHeader
              selectedMessage={selectedMessage}
              isPinned={isPinned ?? false}
              colors={colors}
            />

            {/* Message content preview */}
            <MessagePreviewBody selectedMessage={selectedMessage} colors={colors} />

            {/* Quick Reactions Bar */}
            <View style={styles.quickReactionsBar}>
              {QUICK_REACTIONS.map((emoji) => {
                const hasReacted = getReactionState(emoji);
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.quickReactionBtn,
                      {
                        backgroundColor: hasReacted
                          ? colors.primary + '25'
                          : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.05)',
                        borderColor: hasReacted ? colors.primary : 'transparent',
                        borderWidth: hasReacted ? 1.5 : 0,
                      },
                    ]}
                    onPress={() => onQuickReaction(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.quickReactionBtn,
                  styles.quickReactionMore,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
                onPress={onOpenReactionPicker}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Action Menu Card */}
          <Animated.View
            style={[
              styles.modernActionsCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                transform: [{ translateY: slideUp }, { scale: menuScaleAnim }],
                opacity: backdropOpacity,
              },
            ]}
          >
            <View style={styles.modernActionsHeader}>
              <View style={[styles.modernActionsHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.modernActionsTitle, { color: colors.textSecondary }]}>
                MESSAGE OPTIONS
              </Text>
            </View>

            <View style={styles.modernActionsList}>
              {actionItems.map((item, index) => renderActionItem(item, index))}
            </View>
          </Animated.View>

          {/* Cancel Button */}
          <Animated.View
            style={[
              {
                transform: [{ translateY: slideUp }, { scale: menuScaleAnim }],
                opacity: backdropOpacity,
              },
            ]}
          >
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.modernCancelButton,
                {
                  backgroundColor: isDark
                    ? pressed
                      ? 'rgba(50, 50, 55, 0.98)'
                      : 'rgba(40, 40, 45, 0.95)'
                    : pressed
                      ? 'rgba(240, 240, 245, 0.98)'
                      : 'rgba(255, 255, 255, 0.95)',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text style={[styles.modernCancelText, { color: colors.primary }]}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// Sub-component for message preview header
function MessagePreviewHeader({
  selectedMessage,
  isPinned,
  colors,
}: {
  selectedMessage: Message;
  isPinned: boolean;
  colors: { primary: string; text: string; textSecondary: string };
}) {
  return (
    <View style={styles.modernPreviewHeader}>
      <View style={[styles.modernPreviewAvatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.modernPreviewAvatarText}>
          {(selectedMessage.sender?.display_name || selectedMessage.sender?.username || 'U')
            .charAt(0)
            .toUpperCase()}
        </Text>
      </View>
      <View style={styles.modernPreviewMeta}>
        <Text style={[styles.modernPreviewName, { color: colors.text }]} numberOfLines={1}>
          {selectedMessage.sender?.display_name || selectedMessage.sender?.username || 'Unknown'}
        </Text>
        <Text style={[styles.modernPreviewTime, { color: colors.textSecondary }]}>
          {new Date(selectedMessage.inserted_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {isPinned && (
        <View style={[styles.modernPinnedBadge, { backgroundColor: '#f59e0b20' }]}>
          <Ionicons name="pin" size={12} color="#f59e0b" />
        </View>
      )}
    </View>
  );
}

// Sub-component for message preview body
function MessagePreviewBody({
  selectedMessage,
  colors,
}: {
  selectedMessage: Message;
  colors: { text: string; surfaceHover: string; primary: string };
}) {
  return (
    <View style={styles.modernPreviewBody}>
      {selectedMessage.type === 'image' && selectedMessage.metadata?.url ? (
        <View style={styles.modernPreviewImageWrap}>
          <Image
            source={{ uri: selectedMessage.metadata.url }}
            style={styles.modernPreviewImage}
            resizeMode="cover"
          />
          <View style={styles.modernPreviewImageOverlay}>
            <Ionicons name="image" size={16} color="#fff" />
            <Text style={styles.modernPreviewImageText}>Photo</Text>
          </View>
        </View>
      ) : selectedMessage.type === 'file' ? (
        <View style={[styles.modernPreviewFile, { backgroundColor: colors.surfaceHover }]}>
          <Ionicons name="document-outline" size={20} color={colors.primary} />
          <Text style={[styles.modernPreviewFileText, { color: colors.text }]} numberOfLines={1}>
            {selectedMessage.metadata?.filename || 'File'}
          </Text>
        </View>
      ) : (
        <Text style={[styles.modernPreviewText, { color: colors.text }]} numberOfLines={3}>
          {selectedMessage.content || 'Message'}
        </Text>
      )}
    </View>
  );
}

export default MessageActionsMenu;
