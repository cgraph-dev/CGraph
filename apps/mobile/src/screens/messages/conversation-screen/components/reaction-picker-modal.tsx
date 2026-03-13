/**
 * ReactionPickerModal Component
 *
 * Full emoji picker modal with categories.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Message } from '../../../../types';
import { styles } from '../styles';
import { EMOJI_CATEGORIES } from '../hooks/useReactions';
import { LottieRenderer, emojiToCodepoint, getWebPFallbackUrl } from '@/lib/lottie';

type EmojiCategoryKey = keyof typeof EMOJI_CATEGORIES;

interface ReactionPickerModalProps {
  visible: boolean;
  message: Message | null;
  selectedCategory: EmojiCategoryKey;
  isDark: boolean;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  onClose: () => void;
  onSelectCategory: (category: EmojiCategoryKey) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
}

/**
 * Full emoji picker modal with category tabs.
 */
export function ReactionPickerModal({
  visible,
  message,
  selectedCategory,
  isDark,
  colors,
  onClose,
  onSelectCategory,
  onAddReaction,
  onRemoveReaction,
}: ReactionPickerModalProps) {
  if (!visible || !message) return null;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const categoryKeys = Object.keys(EMOJI_CATEGORIES) as EmojiCategoryKey[];
  const emojis = EMOJI_CATEGORIES[selectedCategory];

  // Check if user has already reacted with an emoji
  const hasReacted = (emoji: string) => {
    return message.reactions?.some((r) => r.emoji === emoji && r.hasReacted) || false;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.reactionPickerOverlay}>
        <Pressable style={styles.reactionPickerBackdrop} onPress={onClose} />
        <View
          style={[
            styles.reactionPickerContainer,
            { backgroundColor: isDark ? '#1a1a2e' : '#ffffff' },
          ]}
        >
          {/* Header */}
          <View style={styles.reactionPickerHeader}>
            <View style={[styles.reactionPickerHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.reactionPickerTitle, { color: colors.text }]}>
              😊 Add Reaction
            </Text>
            <TouchableOpacity style={styles.reactionPickerClose} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Category tabs */}
          <View style={styles.emojiCategoryTabs}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categoryKeys}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.emojiCategoryTab,
                    selectedCategory === item && {
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => onSelectCategory(item)}
                >
                  <Text
                    style={[
                      styles.emojiCategoryLabel,
                      {
                        color: selectedCategory === item ? colors.primary : colors.textSecondary,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.emojiCategoryTabsContent}
            />
          </View>

          {/* Emoji grid */}
          <ScrollView style={styles.emojiScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.emojiGrid}>
              {emojis.map((emoji, index) => {
                const reacted = hasReacted(emoji);
                return (
                  <TouchableOpacity
                    key={`${emoji}-${index}`}
                    style={[
                      styles.emojiGridItem,
                      reacted && {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => {
                      if (reacted) {
                        onRemoveReaction(message.id, emoji);
                      } else {
                        onAddReaction(message.id, emoji);
                      }
                      onClose();
                    }}
                    activeOpacity={0.6}
                  >
                    <LottieRenderer
                      emoji={emoji}
                      size={28}
                      autoplay={reacted}
                      fallbackSrc={getWebPFallbackUrl(emojiToCodepoint(emoji))}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default ReactionPickerModal;
