/**
 * AnimatedReactionBubble Component
 * 
 * Interactive reaction bubble with animated feedback on tap.
 * Provides haptic and visual feedback for emoji reactions.
 * 
 * @module components/conversation/AnimatedReactionBubble
 * @since v0.7.29
 */

import React, { memo, useRef, useCallback } from 'react';
import { TouchableOpacity, Text, Animated, Easing, StyleSheet } from 'react-native';

export interface ReactionData {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface ThemeColors {
  primary: string;
  surface: string;
  text: string;
}

export interface AnimatedReactionBubbleProps {
  /** Reaction data including emoji, count, and user reaction state */
  reaction: ReactionData;
  /** Whether this reaction is on the current user's message */
  isOwnMessage: boolean;
  /** Callback when the reaction is tapped */
  onPress: () => void;
  /** Theme colors for styling */
  colors: ThemeColors;
}

/**
 * Animated reaction bubble that displays emoji reactions on messages.
 * 
 * Features:
 * - Bounce animation on tap for satisfying feedback
 * - Visual distinction for user's own reactions
 * - Count display for multiple reactions
 * - Optimized with memoization
 * 
 * Animation behavior:
 * - Scale pulse from 1 → 1.3 → 1 on press
 * - Emoji "jump" with translateY animation
 * - Spring physics for natural movement
 * 
 * @example
 * ```tsx
 * <AnimatedReactionBubble
 *   reaction={{ emoji: '❤️', count: 5, hasReacted: true }}
 *   isOwnMessage={false}
 *   onPress={() => handleReactionTap('❤️')}
 *   colors={themeColors}
 * />
 * ```
 */
export const AnimatedReactionBubble = memo(function AnimatedReactionBubble({
  reaction,
  isOwnMessage,
  onPress,
  colors,
}: AnimatedReactionBubbleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    // Bounce animation sequence on tap
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();

    // Emoji "jump" animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -8,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
    ]).start();

    onPress();
  }, [scaleAnim, bounceAnim, onPress]);

  // Dynamic styles based on reaction state and message ownership
  const bubbleStyle = {
    backgroundColor: reaction.hasReacted
      ? isOwnMessage
        ? 'rgba(255,255,255,0.25)'
        : `${colors.primary}25`
      : isOwnMessage
        ? 'rgba(255,255,255,0.12)'
        : colors.surface,
    borderColor: reaction.hasReacted ? colors.primary : 'transparent',
    borderWidth: reaction.hasReacted ? 1.5 : 0,
  };

  return (
    <TouchableOpacity
      style={[styles.reactionBubble, bubbleStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.Text
        style={[
          styles.reactionEmoji,
          {
            transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
          },
        ]}
      >
        {reaction.emoji}
      </Animated.Text>
      {reaction.count > 1 && (
        <Text
          style={[
            styles.reactionCount,
            { color: isOwnMessage ? 'rgba(255,255,255,0.9)' : colors.text },
          ]}
        >
          {reaction.count}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginTop: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AnimatedReactionBubble;
