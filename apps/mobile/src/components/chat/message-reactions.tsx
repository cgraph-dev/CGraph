/**
 * MessageReactions Component - Quick Reactions System
 * Quick reactions, emoji picker, animated bubbles
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationColors, HapticFeedback } from '@/lib/animations/animation-engine';
import { LottieRenderer, emojiToCodepoint, getWebPFallbackUrl } from '@/lib/lottie';
import GlassCard from '../ui/glass-card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  onViewReactions?: (emoji: string) => void;
  maxVisible?: number;
}

// Quick reaction presets
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

// Emoji categories for full picker
const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: '😊',
    emojis: [
      '😊',
      '😂',
      '🥰',
      '😍',
      '🤗',
      '😎',
      '🤔',
      '😏',
      '😬',
      '😅',
      '🥺',
      '😭',
      '😡',
      '🤯',
      '😱',
      '🤩',
    ],
  },
  {
    name: 'Gestures',
    icon: '👍',
    emojis: ['👍', '👎', '👏', '🙌', '👊', '✊', '🤝', '🙏', '💪', '🤘', '✌️', '👌'],
  },
  {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️',
      '💕',
      '💖',
      '💗',
      '💓',
      '💝',
      '💘',
      '💟',
      '💙',
      '💚',
      '💛',
      '🧡',
      '💜',
      '🖤',
      '🤍',
      '🤎',
    ],
  },
  {
    name: 'Symbols',
    icon: '🔥',
    emojis: ['🔥', '⭐', '✨', '💫', '⚡', '💥', '💯', '🎉', '🎊', '🏆', '🎯', '💎'],
  },
];

/**
 * Message Reactions component.
 *
 */
export default function MessageReactions({
  _messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
  onViewReactions,
  maxVisible = 3,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(EMOJI_CATEGORIES[0]);
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  const handleReactionPress = (emoji: string) => {
    const reaction = reactions.find((r) => r.emoji === emoji);

    if (reaction?.hasReacted) {
      // Remove reaction
      HapticFeedback.light();
      onRemoveReaction(emoji);

      // Animate out
      if (scaleAnims[emoji]) {
        Animated.sequence([
          Animated.spring(scaleAnims[emoji], {
            toValue: 1.3,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnims[emoji], {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      // Add reaction
      HapticFeedback.medium();
      onAddReaction(emoji);

      // Animate in
      if (!scaleAnims[emoji]) {
        scaleAnims[emoji] = new Animated.Value(0);
      }

      Animated.sequence([
        Animated.spring(scaleAnims[emoji], {
          toValue: 1.3,
          tension: 180,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[emoji], {
          toValue: 1,
          tension: 180,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    handleReactionPress(emoji);
    setShowPicker(false);
  };

  // Initialize scale animations for existing reactions
  reactions.forEach((reaction) => {
    if (!scaleAnims[reaction.emoji]) {
      scaleAnims[reaction.emoji] = new Animated.Value(1);
    }
  });

  const visibleReactions = reactions.slice(0, maxVisible);
  const hasMore = reactions.length > maxVisible;

  return (
    <>
      <View style={styles.container}>
        {/* Existing reactions */}
        {visibleReactions.map((reaction) => (
          <TouchableOpacity
            key={reaction.emoji}
            onPress={() => handleReactionPress(reaction.emoji)}
            onLongPress={() => onViewReactions?.(reaction.emoji)}
            style={styles.reactionBubble}
          >
            <Animated.View
              style={[
                styles.reactionContent,
                reaction.hasReacted && styles.reactionActive,
                {
                  transform: [{ scale: scaleAnims[reaction.emoji] || 1 }],
                },
              ]}
            >
              {reaction.hasReacted && (
                <LinearGradient
                  colors={[AnimationColors.primary, AnimationColors.primaryDark]}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LottieRenderer
                emoji={reaction.emoji}
                size={16}
                autoplay={reaction.hasReacted}
                fallbackSrc={getWebPFallbackUrl(emojiToCodepoint(reaction.emoji))}
              />
              <Text
                style={[styles.reactionCount, reaction.hasReacted && styles.reactionCountActive]}
              >
                {reaction.count}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        ))}

        {/* More indicator */}
        {hasMore && (
          <TouchableOpacity onPress={() => onViewReactions?.('')} style={styles.moreButton}>
            <Text style={styles.moreText}>+{reactions.length - maxVisible}</Text>
          </TouchableOpacity>
        )}

        {/* Add reaction button */}
        <TouchableOpacity
          onPress={() => {
            HapticFeedback.light();
            setShowPicker(true);
          }}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />

          <View style={styles.pickerContainer}>
            <GlassCard variant="frosted" intensity="strong">
              <View style={styles.pickerContent}>
                {/* Header */}
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Add Reaction</Text>
                  <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick reactions */}
                <View style={styles.quickReactions}>
                  {QUICK_REACTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => handleEmojiSelect(emoji)}
                      style={styles.quickReactionButton}
                    >
                      <LottieRenderer
                        emoji={emoji}
                        size={28}
                        autoplay
                        loop
                        fallbackSrc={getWebPFallbackUrl(emojiToCodepoint(emoji))}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Category tabs */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categories}
                  contentContainerStyle={styles.categoriesContent}
                >
                  {EMOJI_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.name}
                      onPress={() => {
                        HapticFeedback.light();
                        setSelectedCategory(category);
                      }}
                      style={[
                        styles.categoryTab,
                        selectedCategory.name === category.name && styles.categoryTabActive,
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Emoji grid */}
                <ScrollView style={styles.emojiScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.emojiGrid}>
                    {selectedCategory.emojis.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => handleEmojiSelect(emoji)}
                        style={styles.emojiButton}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </GlassCard>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  reactionBubble: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  reactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: AnimationColors.dark600,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reactionActive: {
    borderColor: AnimationColors.primary,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: AnimationColors.gray400,
  },
  reactionCountActive: {
    color: AnimationColors.white,
  },
  moreButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: AnimationColors.dark600,
    borderRadius: 16,
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '700',
    color: AnimationColors.gray500,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AnimationColors.dark600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    maxHeight: '70%',
  },
  pickerContent: {
    padding: 0,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AnimationColors.dark600,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AnimationColors.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AnimationColors.dark700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: AnimationColors.gray400,
  },
  quickReactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 20,
  },
  quickReactionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AnimationColors.dark700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionEmoji: {
    fontSize: 28,
  },
  divider: {
    height: 1,
    backgroundColor: AnimationColors.dark600,
    marginHorizontal: 20,
  },
  categories: {
    marginTop: 16,
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AnimationColors.dark700,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: AnimationColors.dark600,
    borderColor: AnimationColors.primary,
  },
  categoryIcon: {
    fontSize: 24,
  },
  emojiScroll: {
    maxHeight: 280,
    marginTop: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 8,
  },
  emojiButton: {
    width: (SCREEN_WIDTH - 96) / 6,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AnimationColors.dark700,
    borderRadius: 12,
  },
  emojiText: {
    fontSize: 28,
  },
});
