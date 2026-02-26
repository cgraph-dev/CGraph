/**
 * AnimatedMessageWrapper Component
 * 
 * Provides smooth entrance animations for messages in the conversation list.
 * Uses React Native Animated API for performant native-driven animations.
 * 
 * @module components/conversation/AnimatedMessageWrapper
 * @since v0.7.29
 */

import { durations } from '@cgraph/animation-constants';
import React, { memo, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

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
  _index,
  isNew = false,
}: AnimatedMessageWrapperProps) {
  const slideAnim = useSharedValue(isNew ? 30 : 0);
  const fadeAnim = useSharedValue(isNew ? 0 : 1);
  const scaleAnim = useSharedValue(isNew ? 0.9 : 1);

  useEffect(() => {
    if (isNew) {
      slideAnim.value = withSpring(0, { stiffness: 100, damping: 12 });
      fadeAnim.value = withTiming(1, { duration: durations.normal.ms });
      scaleAnim.value = withSpring(1, { stiffness: 120, damping: 8 });
    }
  }, [isNew, slideAnim, fadeAnim, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateX: isOwnMessage ? slideAnim.value : slideAnim.value * -1 },
      { scale: scaleAnim.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
});

export default AnimatedMessageWrapper;
