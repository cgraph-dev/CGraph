/**
 * Mobile Page Transition
 *
 * Screen-level animated wrapper for React Native navigation.
 * Uses Reanimated entering/exiting layout animations with
 * shared timing from @cgraph/animation-constants.
 *
 * @module components/ui/PageTransition
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { rnTransitions } from '@cgraph/animation-constants';

// ── Types ───────────────────────────────────────────────────────────────

type TransitionPreset = 'fade' | 'slideRight' | 'slideUp';

interface PageTransitionProps {
  /** Content to animate */
  children: React.ReactNode;
  /** Animation preset */
  preset?: TransitionPreset;
  /** Container style overrides */
  style?: ViewStyle;
}

// ── Preset Configurations ───────────────────────────────────────────────

const enteringPresets = {
  fade: FadeIn.duration(rnTransitions.fadeIn.duration),
  slideRight: SlideInRight.duration(rnTransitions.pageEnter.duration),
  slideUp: FadeIn.duration(rnTransitions.pageEnter.duration), // vertical handled via navigation
} as const;

const exitingPresets = {
  fade: FadeOut.duration(rnTransitions.fadeIn.duration),
  slideRight: SlideOutLeft.duration(rnTransitions.pageEnter.duration),
  slideUp: FadeOut.duration(rnTransitions.fadeIn.duration),
} as const;

// ── Component ───────────────────────────────────────────────────────────

/**
 * Wraps screen content with entering/exiting layout animations.
 *
 * @example
 * ```tsx
 * <PageTransition preset="slideRight">
 *   <ConversationScreen />
 * </PageTransition>
 * ```
 */
export function PageTransition({
  children,
  preset = 'fade',
  style,
}: PageTransitionProps): React.ReactElement {
  return (
    <Animated.View
      entering={enteringPresets[preset]}
      exiting={exitingPresets[preset]}
      style={[styles.container, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PageTransition;
