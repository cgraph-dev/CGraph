/**
 * AnimatedMessageWrapper Component
 *
 * Provides smooth entrance animations for message bubbles
 * using Reanimated v4 (ADR-018 compliant).
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { memo } from 'react';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  Layout,
} from 'react-native-reanimated';
import { getStaggerDelay } from '@/lib/animations/animation-library';
import type { AnimatedMessageProps } from '../types';

/**
 * Wraps message content with Reanimated v4 entrance animations.
 *
 * Own messages slide in from the right, others from the left.
 * Uses Layout.springify() for smooth position changes when
 * messages are inserted or deleted above.
 */
export const AnimatedMessageWrapper = memo(function AnimatedMessageWrapper({
  children,
  isOwnMessage,
  index,
  isNew,
}: AnimatedMessageProps) {
  const delay = getStaggerDelay(index, 30);

  const entering = isNew
    ? isOwnMessage
      ? SlideInRight.delay(delay).springify().damping(18).stiffness(200)
      : SlideInLeft.delay(delay).springify().damping(18).stiffness(200)
    : FadeIn.duration(100);

  return (
    <Animated.View
      entering={entering}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify().damping(18).stiffness(200)}
    >
      {children}
    </Animated.View>
  );
});

export default AnimatedMessageWrapper;
