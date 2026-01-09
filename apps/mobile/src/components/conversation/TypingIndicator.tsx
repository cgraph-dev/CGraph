/**
 * TypingIndicator Component
 * 
 * Animated dots indicating that the other user is typing.
 * Positioned above the input area in conversations.
 * 
 * @module components/conversation/TypingIndicator
 * @since v0.7.29
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';

export interface TypingIndicatorProps {
  /** Whether the other user is currently typing */
  isTyping: boolean;
  /** Display name of the typing user */
  username: string;
  /** Background color for the indicator container */
  backgroundColor: string;
  /** Text color for the indicator */
  textColor: string;
}

/**
 * Typing indicator with animated bouncing dots.
 * 
 * Features:
 * - Three dots with staggered bounce animation
 * - Fade in/out when typing state changes
 * - Shows username of who is typing
 * - Customizable colors for dark/light theme
 * 
 * @example
 * ```tsx
 * <TypingIndicator
 *   isTyping={otherUserTyping}
 *   username="Alice"
 *   backgroundColor="#1a1a2e"
 *   textColor="#a5a5b5"
 * />
 * ```
 */
export const TypingIndicator = memo(function TypingIndicator({
  isTyping,
  username,
  backgroundColor,
  textColor,
}: TypingIndicatorProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Start dot animation
      const bounceAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: -6,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = Animated.parallel([
        bounceAnimation(dot1, 0),
        bounceAnimation(dot2, 150),
        bounceAnimation(dot3, 300),
      ]);

      animations.start();

      return () => {
        animations.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isTyping, fadeAnim, dot1, dot2, dot3]);

  if (!isTyping) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, opacity: fadeAnim },
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {username} is typing
      </Text>
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: textColor, transform: [{ translateY: dot1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: textColor, transform: [{ translateY: dot2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: textColor, transform: [{ translateY: dot3 }] },
          ]}
        />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 2,
  },
});

export default TypingIndicator;
