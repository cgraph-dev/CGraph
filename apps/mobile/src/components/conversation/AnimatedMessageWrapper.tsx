/**
 * AnimatedMessageWrapper Component
 * 
 * Provides smooth entrance animations for messages in the conversation list.
 * Uses React Native Animated API for performant native-driven animations.
 * 
 * @module components/conversation/AnimatedMessageWrapper
 * @since v0.7.29
 */

import React, { memo, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export interface AnimatedMessageWrapperProps {
  /** The message content to wrap with animation */
  children: React.ReactNode;
  /** Whether this is the current user's message (affects slide direction) */
  isOwnMessage: boolean;
  /** Message index in the list (used for stagger calculations) */
  index: number;
  /** Whether this is a newly added message (triggers entrance animation) */
  isNew?: boolean;
}

/**
 * Wraps message bubbles with smooth entrance animations.
 * 
 * Animation behavior:
 * - New messages slide in from the side (left for received, right for sent)
 * - Fade in from 0 to 1 opacity
 * - Scale up from 0.9 to 1 for a subtle "pop" effect
 * - Uses spring physics for natural movement
 * 
 * Performance considerations:
 * - Uses native driver for all animations
 * - Memoized to prevent unnecessary re-renders
 * - Animation refs are preserved across renders
 * 
 * @example
 * ```tsx
 * <AnimatedMessageWrapper
 *   isOwnMessage={true}
 *   index={0}
 *   isNew={true}
 * >
 *   <MessageBubble message={message} />
 * </AnimatedMessageWrapper>
 * ```
 */
export const AnimatedMessageWrapper = memo(function AnimatedMessageWrapper({
  children,
  isOwnMessage,
  index,
  isNew = false,
}: AnimatedMessageWrapperProps) {
  // Initialize animation values based on whether this is a new message
  const slideAnim = useRef(new Animated.Value(isNew ? 30 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(isNew ? 0.9 : 1)).current;

  useEffect(() => {
    if (isNew) {
      // Run entrance animations in parallel for smooth combined effect
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
          // Slide direction based on message ownership
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
