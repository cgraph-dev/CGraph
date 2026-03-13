/**
 * MessageActionsMenu Component
 *
 * Message action sheet with quick reactions,
 * message preview, and action buttons for reply, copy, pin, and delete.
 *
 * @module components/conversation/MessageActionsMenu
 * @since v0.7.29
 */

import React, { memo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Message } from '../../types';
import { QUICK_REACTIONS, ACTION_COLORS } from './constants';
import api from '../../lib/api';

export interface MessageActionsMenuProps {
  /** Whether the menu is visible */
  visible: boolean;
  /** The message being acted upon */
  message: Message | null;
  /** Current user ID for ownership checks */
  userId?: string;
  /** Whether dark mode is active */
  isDark: boolean;
  /** Theme colors */
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    surfaceHover: string;
  };
  /** Animation values for coordinated animations */
  animations: {
    backdrop: Animated.Value;
    messageActions: Animated.Value;
    menuScale: Animated.Value;
    actionItems: Animated.Value[];
  };
  /** Callback to close the menu */
  onClose: () => void;
  /** Callback when reply is selected */
  onReply: () => void;
  /** Callback when copy is selected */
  onCopy: () => void;
  /** Callback when pin/unpin is selected */
  onTogglePin: () => void;
  /** Callback when delete is selected */
  onDelete: () => void;
  /** Callback when forward is selected */
  onForward?: () => void;
  /** Callback for quick reaction selection */
  onQuickReaction: (emoji: string) => void;
  /** Callback to open full reaction picker */
  onOpenReactionPicker: () => void;
}

/**
 * Message context menu with modern iOS-style design.
 *
 * Features:
 * - Blur backdrop with fade animation
 * - Message preview card with sender info
 * - Quick reaction bar for common emojis
 * - Action buttons with staggered entrance animation
 * - Cancel button for easy dismissal
 *
 * Accessibility:
 * - Supports hardware back button on Android
 * - Touch outside to dismiss
 * - Haptic feedback on actions
 */
export const MessageActionsMenu = memo(function MessageActionsMenu({
  visible,
  message,
  userId,
  isDark,
  colors,
  animations,
  onClose,
  onReply,
  onCopy,
  onTogglePin,
  onDelete,
  onForward,
  onQuickReaction,
  onOpenReactionPicker,
}: MessageActionsMenuProps) {
  // Check if user has reacted with specific emoji
  // Hooks must be called before any early returns
  const getReactionState = useCallback(
    (emoji: string) => {
      return message?.reactions?.some((r) => r.emoji === emoji && r.hasReacted) || false;
    },
    [message?.reactions]
  );

  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !message) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/v1/saved-messages');
        const found = (data.data || []).find(
          (s: { message_id: string; id: string }) => s.message_id === message.id
        );
        if (!cancelled) {
          setIsSaved(!!found);
          setSavedId(found?.id ?? null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, message]);

  const handleToggleSave = useCallback(async () => {
    if (saving || !message) return;
    setSaving(true);
    try {
      if (isSaved && savedId) {
        await api.delete(`/api/v1/saved-messages/${savedId}`);
        setIsSaved(false);
        setSavedId(null);
      } else {
        const { data } = await api.post('/api/v1/saved-messages', { message_id: message.id });
        setIsSaved(true);
        setSavedId(data.data?.id ?? null);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [isSaved, savedId, saving, message]);

  // Early return after hooks
  if (!visible || !message) return null;

  const isOwnMessage = String(userId) === String(message.sender_id);
  const isPinned = message.is_pinned;

  // Build action items based on context
  const actionItems = [
    {
      id: 'reply',
      icon: 'arrow-undo',
      label: 'Reply',
      color: ACTION_COLORS.reply,
      onPress: onReply,
      visible: true,
    },
    {
      id: 'copy',
      icon: 'copy-outline',
      label: 'Copy',
      color: ACTION_COLORS.copy,
      onPress: onCopy,
      visible: !!message.content,
    },
    {
      id: 'pin',
      icon: isPinned ? 'pin-outline' : 'pin',
      label: isPinned ? 'Unpin' : 'Pin',
      color: isPinned ? ACTION_COLORS.unpin : ACTION_COLORS.pin,
      onPress: onTogglePin,
      visible: true,
    },
    {
      id: 'forward',
      icon: 'arrow-redo',
      label: 'Forward',
      color: ACTION_COLORS.forward,
      onPress: onForward ?? (() => {}),
      visible: !!onForward,
    },
    {
      id: 'save',
      icon: isSaved ? 'bookmark' : 'bookmark-outline',
      label: isSaved ? 'Unsave' : 'Save',
      color: '#6366f1',
      onPress: handleToggleSave,
      visible: true,
    },
    {
      id: 'delete',
      icon: 'trash-outline',
      label: 'Unsend',
      color: ACTION_COLORS.delete,
      onPress: onDelete,
      visible: isOwnMessage,
      danger: true,
    },
  ].filter((item) => item.visible);

  // Animation interpolations
  const slideUp = animations.messageActions.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const backdropOpacity = animations.backdrop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const renderActionItem = (item: (typeof actionItems)[0], index: number) => {
    const itemAnim = animations.actionItems[index] || new Animated.Value(1);
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
            styles.actionItem,
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
          <View style={[styles.actionIconWrap, { backgroundColor: `${item.color}18` }]}>
            {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */}
            <Ionicons name={item.icon as any} size={20} color={item.color} />
          </View>
          <Text style={[styles.actionLabel, { color: item.danger ? item.color : colors.text }]}>
            {item.label}
          </Text>
          <View style={styles.actionArrow}>
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
      <View style={styles.overlay}>
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

        <View style={styles.content}>
          {/* Message Preview Card */}
          <Animated.View
            style={[
              styles.messagePreview,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                transform: [{ translateY: slideUp }, { scale: animations.menuScale }],
                opacity: backdropOpacity,
              },
            ]}
          >
            <View style={styles.previewHeader}>
              <View style={[styles.previewAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.previewAvatarText}>
                  {(message.sender?.display_name || message.sender?.username || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.previewMeta}>
                <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
                  {message.sender?.display_name || message.sender?.username || 'Unknown'}
                </Text>
                <Text style={[styles.previewTime, { color: colors.textSecondary }]}>
                  {new Date(message.inserted_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {isPinned && (
                <View style={[styles.pinnedBadge, { backgroundColor: '#f59e0b20' }]}>
                  <Ionicons name="pin" size={12} color="#f59e0b" />
                </View>
              )}
            </View>

            {/* Message content preview */}
            <View style={styles.previewBody}>
              {message.type === 'image' && message.metadata?.url ? (
                <View style={styles.previewImageWrap}>
                  <Image
                    source={{ uri: message.metadata.url }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.previewImageOverlay}>
                    <Ionicons name="image" size={16} color="#fff" />
                    <Text style={styles.previewImageText}>Photo</Text>
                  </View>
                </View>
              ) : message.type === 'file' ? (
                <View style={[styles.previewFile, { backgroundColor: colors.surfaceHover }]}>
                  <Ionicons name="document-outline" size={20} color={colors.primary} />
                  <Text style={[styles.previewFileText, { color: colors.text }]} numberOfLines={1}>
                    {message.metadata?.filename || 'File'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={3}>
                  {message.content || 'Message'}
                </Text>
              )}
            </View>

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
                          ? `${colors.primary}25`
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
              styles.actionsCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                transform: [{ translateY: slideUp }, { scale: animations.menuScale }],
                opacity: backdropOpacity,
              },
            ]}
          >
            <View style={styles.actionsHeader}>
              <View style={[styles.actionsHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.actionsTitle, { color: colors.textSecondary }]}>
                MESSAGE OPTIONS
              </Text>
            </View>
            <View style={styles.actionsList}>{actionItems.map(renderActionItem)}</View>
          </Animated.View>

          {/* Cancel Button */}
          <Animated.View
            style={[
              {
                transform: [{ translateY: slideUp }, { scale: animations.menuScale }],
                opacity: backdropOpacity,
              },
            ]}
          >
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
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
              <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 10,
  },
  messagePreview: {
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewMeta: {
    flex: 1,
    marginLeft: 10,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewTime: {
    fontSize: 11,
    marginTop: 1,
  },
  pinnedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBody: {
    marginTop: 2,
  },
  previewText: {
    fontSize: 15,
    lineHeight: 21,
  },
  previewImageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewImageOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  previewImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  previewFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  previewFileText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  quickReactionsBar: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
    gap: 8,
  },
  quickReactionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionMore: {
    marginLeft: 'auto',
  },
  quickReactionEmoji: {
    fontSize: 20,
  },
  actionsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  actionsHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  actionsHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  actionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  actionsList: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  actionArrow: {
    marginLeft: 8,
  },
  cancelButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

export default MessageActionsMenu;
