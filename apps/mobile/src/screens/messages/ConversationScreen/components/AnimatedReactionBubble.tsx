/**
 * AnimatedReactionBubble Component
 *
 * Animated reaction bubble with bounce effects on interaction.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { useRef, memo } from 'react';
import { TouchableOpacity, Text, Animated, Easing, StyleSheet } from 'react-native';
import type { AnimatedReactionBubbleProps } from '../types';

/**
 * Displays a single reaction bubble with animation effects.
 *
 * Features:
 * - Scale animation on press
 * - Bounce animation for the emoji
 * - Visual distinction for user's own reactions
 */
export const AnimatedReactionBubble = memo(function AnimatedReactionBubble({
  reaction,
  isOwnMessage,
  onPress,
  colors,
}: AnimatedReactionBubbleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    // Bounce animation on tap
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

    // Also trigger the emoji bounce
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
  };

  return (
    <TouchableOpacity
      style={[
        styles.reactionBubble,
        {
          backgroundColor: reaction.hasReacted
            ? isOwnMessage
              ? 'rgba(255,255,255,0.25)'
              : colors.primary + '25'
            : isOwnMessage
              ? 'rgba(255,255,255,0.12)'
              : colors.surface,
          borderColor: reaction.hasReacted ? colors.primary : 'transparent',
          borderWidth: reaction.hasReacted ? 1.5 : 0,
        },
      ]}
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
    marginLeft: 2,
    fontWeight: '500',
  },
});

export default AnimatedReactionBubble;
