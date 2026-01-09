/**
 * ReactionPickerModal Component
 * 
 * Full emoji picker modal for adding reactions to messages.
 * Organized by category with scrollable grid layout.
 * 
 * @module components/conversation/ReactionPickerModal
 * @since v0.7.29
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../../types';
import { EMOJI_CATEGORIES, EmojiCategory } from './constants';

export interface ReactionPickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The message to add reactions to */
  message: Message | null;
  /** Currently selected emoji category */
  selectedCategory: EmojiCategory;
  /** Whether dark mode is active */
  isDark: boolean;
  /** Theme colors */
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  /** Callback when category is changed */
  onCategoryChange: (category: EmojiCategory) => void;
  /** Callback when an emoji is selected */
  onAddReaction: (messageId: string, emoji: string) => void;
  /** Callback when a reaction is removed */
  onRemoveReaction: (messageId: string, emoji: string) => void;
  /** Callback to close the picker */
  onClose: () => void;
}

/**
 * Full-screen emoji picker with category tabs.
 * 
 * Features:
 * - Category tabs for easy navigation
 * - Scrollable emoji grid
 * - Visual indicator for already-reacted emojis
 * - Tap to add/remove reactions
 * 
 * @example
 * ```tsx
 * <ReactionPickerModal
 *   visible={showPicker}
 *   message={selectedMessage}
 *   selectedCategory="Smileys"
 *   isDark={true}
 *   colors={themeColors}
 *   onCategoryChange={setCategory}
 *   onAddReaction={handleAdd}
 *   onRemoveReaction={handleRemove}
 *   onClose={() => setShowPicker(false)}
 * />
 * ```
 */
export const ReactionPickerModal = memo(function ReactionPickerModal({
  visible,
  message,
  selectedCategory,
  isDark,
  colors,
  onCategoryChange,
  onAddReaction,
  onRemoveReaction,
  onClose,
}: ReactionPickerModalProps) {
  if (!visible || !message) return null;

  const categoryKeys = Object.keys(EMOJI_CATEGORIES) as EmojiCategory[];
  const emojis = EMOJI_CATEGORIES[selectedCategory];

  // Check if user has already reacted with specific emoji
  const hasReacted = useCallback(
    (emoji: string) => {
      return message.reactions?.some((r) => r.emoji === emoji && r.hasReacted) || false;
    },
    [message.reactions]
  );

  const handleEmojiPress = useCallback(
    (emoji: string) => {
      if (hasReacted(emoji)) {
        onRemoveReaction(message.id, emoji);
      } else {
        onAddReaction(message.id, emoji);
      }
      onClose();
    },
    [message.id, hasReacted, onAddReaction, onRemoveReaction, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.container, { backgroundColor: isDark ? '#1a1a2e' : '#ffffff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.text }]}>😊 Add Reaction</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Category tabs */}
          <View style={styles.categoryTabs}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categoryKeys}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryTab,
                    selectedCategory === item && {
                      backgroundColor: `${colors.primary}20`,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => onCategoryChange(item)}
                >
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: selectedCategory === item ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.categoryTabsContent}
            />
          </View>

          {/* Emoji grid */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {emojis.map((emoji, index) => {
                const reacted = hasReacted(emoji);
                return (
                  <TouchableOpacity
                    key={`${emoji}-${index}`}
                    style={[
                      styles.gridItem,
                      reacted && {
                        backgroundColor: `${colors.primary}20`,
                        borderColor: colors.primary,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => handleEmojiPress(emoji)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.gridEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  handle: {
    position: 'absolute',
    top: 8,
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  categoryTabs: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  categoryTabsContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingVertical: 12,
  },
  gridItem: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  gridEmoji: {
    fontSize: 28,
  },
});

export default ReactionPickerModal;
