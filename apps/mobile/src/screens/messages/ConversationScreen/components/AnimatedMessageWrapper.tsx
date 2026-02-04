/**
 * AnimatedMessageWrapper Component
 *
 * Provides smooth entrance animations for message bubbles.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { useRef, useEffect, memo } from 'react';
import { Animated } from 'react-native';
import type { AnimatedMessageProps } from '../types';

/**
 * Wraps message content with entrance animations.
 *
 * Animates messages sliding in from the side (direction based on sender)
 * with fade and scale effects for smooth appearance.
 */
export const AnimatedMessageWrapper = memo(function AnimatedMessageWrapper({
  children,
  isOwnMessage,
  index,
  isNew,
}: AnimatedMessageProps) {
  const slideAnim = useRef(new Animated.Value(isNew ? 30 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(isNew ? 0.9 : 1)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
      ]).start();
    }
  }, [isNew, slideAnim, fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateX: isOwnMessage ? slideAnim : Animated.multiply(slideAnim, -1) },
          { scale: scaleAnim },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
});

export default AnimatedMessageWrapper;
