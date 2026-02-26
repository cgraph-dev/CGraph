/**
 * PullToRefresh - Custom Pull-to-Refresh with Physics
 *
 * Features:
 * - Custom refresh indicator animations
 * - Spring physics for natural feel
 * - Multiple indicator styles (spinner, lottie, custom)
 * - Progress-based feedback
 * - Haptic feedback at trigger point
 * - Customizable threshold and resistance
 */

import React, { useCallback, useState, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, ScrollView, ScrollViewProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  cancelAnimation,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS, getSpringConfig } from '../../lib/animations/animation-library';

// ============================================================================
// Types
// ============================================================================

export type RefreshIndicatorStyle = 'spinner' | 'dots' | 'progress' | 'arrows' | 'custom';

export interface PullToRefreshProps extends Omit<ScrollViewProps, 'onScroll' | 'indicatorStyle'> {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;

  // Appearance
  refreshIndicatorStyle?: RefreshIndicatorStyle;
  indicatorColor?: string;
  indicatorSize?: number;
  backgroundColor?: string;

  // Behavior
  threshold?: number;
  resistance?: number;
  enabled?: boolean;

  // Custom indicator
  renderIndicator?: (progress: SharedValue<number>, isRefreshing: boolean) => React.ReactNode;

  // Style
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;

  // Animation
  springPreset?: keyof typeof SPRING_PRESETS;

  // Haptics
  hapticFeedback?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_THRESHOLD = 80;
const DEFAULT_RESISTANCE = 2.5;
const DEFAULT_INDICATOR_SIZE = 40;

// ============================================================================
// Component
// ============================================================================

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/**
 *
 */
export function PullToRefresh({
  onRefresh,
  children,
  refreshIndicatorStyle = 'spinner',
  indicatorColor = '#10b981',
  indicatorSize = DEFAULT_INDICATOR_SIZE,
  backgroundColor = '#111827',
  threshold = DEFAULT_THRESHOLD,
  resistance = DEFAULT_RESISTANCE,
  enabled = true,
  renderIndicator,
  style,
  contentContainerStyle,
  springPreset = 'bouncy',
  hapticFeedback = true,
  ...scrollViewProps
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullDistance = useSharedValue(0);
  const refreshProgress = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const springConfig = SPRING_PRESETS[springPreset];
  const springCfg = getSpringConfig(springConfig);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticFeedback]);

  // Handle refresh complete
  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
    pullDistance.value = withSpring(0, springCfg);
    refreshProgress.value = withTiming(0, { duration: 200 });
    indicatorOpacity.value = withTiming(0, { duration: 200 });
  }, [springCfg]);

  // Handle refresh trigger
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      handleRefreshComplete();
    }
  }, [onRefresh, handleRefreshComplete]);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (!enabled || isRefreshing) return;

      const offsetY = event.contentOffset.y;

      if (offsetY < 0) {
        // Pulling down
        const pull = Math.abs(offsetY);
        const resistedPull = pull / resistance;
        pullDistance.value = resistedPull;

        // Calculate progress (0-1)
        const progress = Math.min(resistedPull / threshold, 1);
        refreshProgress.value = progress;
        indicatorOpacity.value = Math.min(progress * 2, 1);

        // Haptic feedback at threshold
        if (progress >= 1 && !hasTriggeredHaptic.value) {
          hasTriggeredHaptic.value = true;
          runOnJS(triggerHaptic)();
        } else if (progress < 1) {
          hasTriggeredHaptic.value = false;
        }
      } else {
        pullDistance.value = 0;
        refreshProgress.value = 0;
        indicatorOpacity.value = 0;
      }
    },
    onEndDrag: (event) => {
      if (!enabled || isRefreshing) return;

      const offsetY = event.contentOffset.y;

      if (offsetY < -threshold * resistance) {
        // Trigger refresh
        pullDistance.value = withSpring(threshold, springCfg);
        runOnJS(handleRefresh)();
      } else {
        // Snap back
        pullDistance.value = withSpring(0, springCfg);
        refreshProgress.value = withTiming(0, { duration: 200 });
        indicatorOpacity.value = withTiming(0, { duration: 200 });
      }
    },
  });

  // Indicator container style
  const indicatorContainerStyle = useAnimatedStyle(() => ({
    height: pullDistance.value,
    opacity: indicatorOpacity.value,
  }));

  // Render indicator based on style
  const indicator = useMemo(() => {
    if (renderIndicator) {
      return renderIndicator(refreshProgress, isRefreshing);
    }

    switch (refreshIndicatorStyle) {
      case 'spinner':
        return (
          <SpinnerIndicator
            progress={refreshProgress}
            isRefreshing={isRefreshing}
            color={indicatorColor}
            size={indicatorSize}
          />
        );
      case 'dots':
        return (
          <DotsIndicator
            progress={refreshProgress}
            isRefreshing={isRefreshing}
            color={indicatorColor}
            size={indicatorSize}
          />
        );
      case 'progress':
        return (
          <ProgressIndicator
            progress={refreshProgress}
            isRefreshing={isRefreshing}
            color={indicatorColor}
            size={indicatorSize}
          />
        );
      case 'arrows':
        return (
          <ArrowsIndicator
            progress={refreshProgress}
            isRefreshing={isRefreshing}
            color={indicatorColor}
            size={indicatorSize}
          />
        );
      default:
        return null;
    }
  }, [refreshIndicatorStyle, indicatorColor, indicatorSize, renderIndicator, isRefreshing]);

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {/* Refresh indicator */}
      <Animated.View style={[styles.indicatorContainer, indicatorContainerStyle]}>
        {indicator}
      </Animated.View>

      {/* Scrollable content */}
      <AnimatedScrollView
        {...scrollViewProps}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
        bounces={enabled}
      >
        {children}
      </AnimatedScrollView>
    </View>
  );
}

// ============================================================================
// Indicator Components
// ============================================================================

interface IndicatorProps {
  progress: SharedValue<number>;
  isRefreshing: boolean;
  color: string;
  size: number;
}

function SpinnerIndicator({ progress, isRefreshing, color, size }: IndicatorProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (isRefreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isRefreshing]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseRotation = interpolate(progress.value, [0, 1], [0, 180]);
    const totalRotation = isRefreshing ? rotation.value : baseRotation;

    return {
      transform: [{ rotate: `${totalRotation}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.spinner, { width: size, height: size }, animatedStyle]}>
      <View
        style={[
          styles.spinnerArc,
          {
            borderColor: color,
            borderWidth: size / 10,
            width: size,
            height: size,
          },
        ]}
      />
    </Animated.View>
  );
}

function DotsIndicator({ progress, isRefreshing, color, size }: IndicatorProps) {
  const dotCount = 3;
  const dots = Array.from({ length: dotCount });

  return (
    <View style={[styles.dotsContainer, { height: size }]}>
      {dots.map((_, index) => (
        <DotItem
          key={index}
          index={index}
          progress={progress}
          isRefreshing={isRefreshing}
          color={color}
          size={size / 4}
        />
      ))}
    </View>
  );
}

interface DotItemProps {
  index: number;
  progress: SharedValue<number>;
  isRefreshing: boolean;
  color: string;
  size: number;
}

function DotItem({ index, progress, isRefreshing, color, size }: DotItemProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (isRefreshing) {
      scale.value = withRepeat(
        withTiming(1.5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [isRefreshing]);

  const animatedStyle = useAnimatedStyle(() => {
    const dotProgress = interpolate(
      progress.value,
      [index * 0.2, index * 0.2 + 0.5, 1],
      [0, 1, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity: dotProgress,
      transform: [
        { scale: isRefreshing ? scale.value : interpolate(dotProgress, [0, 1], [0.5, 1]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.dot, { width: size, height: size, backgroundColor: color }, animatedStyle]}
    />
  );
}

function ProgressIndicator({ progress, isRefreshing, color, size }: IndicatorProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, size * 2]),
  }));

  return (
    <View style={[styles.progressContainer, { width: size * 2, height: size / 5 }]}>
      <Animated.View
        style={[styles.progressBar, { backgroundColor: color, height: size / 5 }, animatedStyle]}
      />
    </View>
  );
}

function ArrowsIndicator({ progress, isRefreshing, color, size }: IndicatorProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (isRefreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 800, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isRefreshing]);

  const arrowStyle = useAnimatedStyle(() => {
    const baseRotation = interpolate(progress.value, [0, 1], [0, 180]);
    const totalRotation = isRefreshing ? rotation.value : baseRotation;

    return {
      transform: [{ rotate: `${totalRotation}deg` }],
    };
  });

  return (
    <Animated.View style={arrowStyle}>
      <Animated.Text style={[styles.arrowText, { fontSize: size, color }]}>↻</Animated.Text>
    </Animated.View>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export interface RefreshableListProps<T = unknown> extends PullToRefreshProps {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  ItemSeparator?: React.ComponentType;
}

/**
 *
 */
export function RefreshableList({
  data,
  renderItem,
  keyExtractor = (_, index) => String(index),
  ItemSeparator,
  ...pullToRefreshProps
}: RefreshableListProps) {
  return (
    <PullToRefresh {...pullToRefreshProps}>
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {index > 0 && ItemSeparator && <ItemSeparator />}
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </PullToRefresh>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 1,
  },
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerArc: {
    borderRadius: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 100,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
  arrowText: {
    fontWeight: '300',
  },
});

export default PullToRefresh;
