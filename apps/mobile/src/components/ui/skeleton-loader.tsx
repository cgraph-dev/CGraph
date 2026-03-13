/**
 * Mobile Skeleton Loader
 *
 * Reusable shimmer skeleton component for React Native.
 * Uses Reanimated shared values for a smooth opacity pulse.
 * Timing sourced from @cgraph/animation-constants.
 *
 * @module components/ui/SkeletonLoader
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { rnTransitions } from '@cgraph/animation-constants';

// ── Types ───────────────────────────────────────────────────────────────

interface SkeletonLoaderProps {
  /** Width of the skeleton — number (px) or string ('100%') */
  width?: number | string;
  /** Height in px */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Variant preset */
  variant?: 'text' | 'circle' | 'rect';
  /** Style overrides */
  style?: ViewStyle;
}

// ── Component ───────────────────────────────────────────────────────────

/**
 * Animated skeleton placeholder with a smooth shimmer pulse.
 *
 * @example
 * ```tsx
 * <SkeletonLoader width={120} height={16} variant="text" />
 * <SkeletonLoader width={48} height={48} variant="circle" />
 * ```
 */
export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius,
  variant = 'rect',
  style,
}: SkeletonLoaderProps): React.ReactElement {
  const pulse = useSharedValue(0);

  useEffect(() => {
    const dur = rnTransitions.fadeIn.duration;
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: dur * 2 }), withTiming(0, { duration: dur * 2 })),
      -1,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.25, 0.6]),
  }));

  // Derive border radius from variant
  const resolvedRadius =
    borderRadius ?? (variant === 'circle' ? (typeof height === 'number' ? height / 2 : 24) : variant === 'text' ? 4 : 8);

  // Circle forces equal width/height
  const resolvedWidth = variant === 'circle' ? height : width;

  return (
    <Animated.View
      style={[
        {
          width: resolvedWidth as number | string,
          height,
          borderRadius: resolvedRadius,
          backgroundColor: '#374151',
        } as Record<string, unknown>,
        animatedStyle,
        style,
      ]}
    />
  );
}

// ── Preset compositions ─────────────────────────────────────────────────

/** Row of text-like skeleton lines */
export function SkeletonTextBlock({
  lines = 3,
  lineHeight = 14,
  gap = 8,
  style,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  style?: ViewStyle;
}): React.ReactElement {
  return (
    <Animated.View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          variant="text"
          height={lineHeight}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </Animated.View>
  );
}

/** Avatar + text row skeleton */
export function SkeletonListItem({ style }: { style?: ViewStyle }): React.ReactElement {
  return (
    <Animated.View style={[styles.listItem, style]}>
      <SkeletonLoader variant="circle" height={40} />
      <Animated.View style={styles.listItemText}>
        <SkeletonLoader variant="text" height={14} width="70%" />
        <SkeletonLoader variant="text" height={12} width="45%" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  listItemText: {
    flex: 1,
    gap: 6,
  },
});

export default SkeletonLoader;
