/**
 * AnimatedList, AnimatedImage, AnimatedCounter, AnimatedProgress
 *
 * Smaller animated component primitives for lists, images, counters, and progress bars.
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Layout,
  interpolate,
} from 'react-native-reanimated';

import { SPRING_PRESETS } from './animation-library';
import { ENTERING_PRESETS } from './animation-presets';

// ============================================================================
// AnimatedList Component
// ============================================================================

export interface AnimatedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  entering?: keyof typeof ENTERING_PRESETS;
  staggerDelay?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
}

/**
 * Animated List component.
 *
 */
export function AnimatedList<T>({
  data,
  renderItem,
  keyExtractor,
  entering = 'fadeInUp',
  staggerDelay = 50,
  style,
  itemStyle,
}: AnimatedListProps<T>) {
  const EnteringAnimation = ENTERING_PRESETS[entering];

  return (
    <View style={style}>
      {data.map((item, index) => (
        <Animated.View
          key={keyExtractor(item, index)}
          entering={EnteringAnimation.delay(index * staggerDelay).duration(300)}
          layout={Layout.springify()}
          style={itemStyle}
        >
          {renderItem(item, index)}
        </Animated.View>
      ))}
    </View>
  );
}

// ============================================================================
// AnimatedImage Component
// ============================================================================

export interface AnimatedImageProps {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  entering?: keyof typeof ENTERING_PRESETS;
  delay?: number;
  loadingEffect?: 'fade' | 'blur' | 'shimmer';
}

/**
 * Animated Image component.
 *
 */
export function AnimatedImage({
  source,
  style,
  entering = 'fadeIn',
  delay = 0,
  loadingEffect = 'fade',
}: AnimatedImageProps) {
  const EnteringAnimation = ENTERING_PRESETS[entering];
  const loadProgress = useSharedValue(0);
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    loadProgress.value = withTiming(1, { duration: durations.slower.ms });

    if (loadingEffect === 'shimmer') {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: durations.verySlow.ms }),
        -1,
        false
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingEffect]);

  const loadingStyle = useAnimatedStyle(() => {
    switch (loadingEffect) {
      case 'fade':
        return { opacity: loadProgress.value };
      case 'blur':
        return { opacity: loadProgress.value };
      case 'shimmer':
        return {
          opacity: interpolate(shimmerPosition.value, [0, 0.5, 1], [0.5, 1, 0.5]),
        };
      default:
        return {};
    }
  });

  return (
    <Animated.View entering={EnteringAnimation.delay(delay).duration(300)} style={loadingStyle}>
      <Image source={source} style={style} />
    </Animated.View>
  );
}

// ============================================================================
// AnimatedCounter Component
// ============================================================================

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * Animated Counter component.
 *
 */
export function AnimatedCounter({
  value,
  duration = 1000,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = animatedValue.value;
      setDisplayValue(current);
    }, 16);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedValue =
    decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <Text style={style}>
      {prefix}
      {formattedValue}
      {suffix}
    </Text>
  );
}

// ============================================================================
// AnimatedProgress Component
// ============================================================================

export interface AnimatedProgressProps {
  progress: number; // 0-1
  width?: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
}

/**
 * Animated Progress component.
 *
 */
export function AnimatedProgress({
  progress,
  width = 200,
  height = 8,
  backgroundColor = '#374151',
  progressColor = '#10b981',
  style,
  animated = true,
}: AnimatedProgressProps) {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    if (animated) {
      progressWidth.value = withSpring(clampedProgress * width, SPRING_PRESETS.default);
    } else {
      progressWidth.value = clampedProgress * width;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, width, animated]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  return (
    <View style={[styles.progressContainer, { width, height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.progressBar,
          { height, backgroundColor: progressColor },
          animatedProgressStyle,
        ]}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  progressContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
});
