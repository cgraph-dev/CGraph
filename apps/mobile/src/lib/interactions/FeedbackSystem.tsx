/**
 * FeedbackSystem - Interaction Feedback Components
 *
 * Features:
 * - Press state animations (scale, glow, shadow)
 * - Loading skeletons with shimmer
 * - Success/error animations
 * - Empty state animations
 * - Ripple effects
 * - State transition feedback
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Pressable,
  PressableProps,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  interpolateColor,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS } from '../animations/AnimationLibrary';

// ============================================================================
// Types
// ============================================================================

export type PressStyle = 'scale' | 'opacity' | 'glow' | 'shadow' | 'lift' | 'none';
export type FeedbackIntensity = 'light' | 'medium' | 'heavy';

export interface PressableFeedbackProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  pressStyle?: PressStyle | PressStyle[];
  scaleAmount?: number;
  opacityAmount?: number;
  glowColor?: string;
  hapticFeedback?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  springPreset?: keyof typeof SPRING_PRESETS;
  style?: StyleProp<ViewStyle>;
}

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  shimmerColor?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface SuccessAnimationProps {
  visible: boolean;
  size?: number;
  color?: string;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface ErrorAnimationProps {
  visible: boolean;
  size?: number;
  color?: string;
  shake?: boolean;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface RippleProps {
  color?: string;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  onPress?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Pressable Feedback Component
// ============================================================================

export function PressableFeedback({
  children,
  pressStyle = 'scale',
  scaleAmount = 0.95,
  opacityAmount = 0.7,
  glowColor = '#10b981',
  hapticFeedback = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  springPreset = 'snappy',
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...pressableProps
}: PressableFeedbackProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(4);
  const translateY = useSharedValue(0);

  const springConfig = SPRING_PRESETS[springPreset];
  const pressStyles = Array.isArray(pressStyle) ? pressStyle : [pressStyle];

  const handlePressIn = useCallback(
    (e: any) => {
      if (pressStyles.includes('scale')) {
        scale.value = withSpring(scaleAmount, springConfig);
      }
      if (pressStyles.includes('opacity')) {
        opacity.value = withTiming(opacityAmount, { duration: 100 });
      }
      if (pressStyles.includes('glow')) {
        glowOpacity.value = withTiming(0.5, { duration: 150 });
      }
      if (pressStyles.includes('shadow')) {
        shadowRadius.value = withSpring(12, springConfig);
      }
      if (pressStyles.includes('lift')) {
        translateY.value = withSpring(-4, springConfig);
        shadowRadius.value = withSpring(16, springConfig);
      }

      onPressIn?.(e);
    },
    [pressStyles, scaleAmount, opacityAmount, springConfig, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, springConfig);
      opacity.value = withTiming(1, { duration: 100 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      shadowRadius.value = withSpring(4, springConfig);
      translateY.value = withSpring(0, springConfig);

      onPressOut?.(e);
    },
    [springConfig, onPressOut]
  );

  const handlePress = useCallback(
    (e: any) => {
      if (hapticFeedback) {
        Haptics.impactAsync(hapticStyle);
      }
      onPress?.(e);
    },
    [hapticFeedback, hapticStyle, onPress]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
    shadowRadius: shadowRadius.value,
    shadowOpacity: interpolate(shadowRadius.value, [4, 16], [0.15, 0.3]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...pressableProps}
    >
      <Animated.View style={[style, animatedStyle]}>
        {/* Glow effect */}
        {pressStyles.includes('glow') && (
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.glow, { shadowColor: glowColor }, glowStyle]}
          />
        )}
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// Skeleton Component
// ============================================================================

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  shimmerColor = 'rgba(255, 255, 255, 0.1)',
  backgroundColor = '#374151',
  animated = true,
  style,
}: SkeletonProps) {
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    if (animated) {
      shimmerPosition.value = withRepeat(
        withTiming(2, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    }

    return () => {
      cancelAnimation(shimmerPosition);
    };
  }, [animated]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerPosition.value * (typeof width === 'number' ? width : SCREEN_WIDTH) },
    ],
  }));

  return (
    <View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, backgroundColor },
        style,
      ]}
    >
      {animated && (
        <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', shimmerColor, 'transparent'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.shimmer, { width: typeof width === 'number' ? width : SCREEN_WIDTH }]}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ============================================================================
// Skeleton Group Component
// ============================================================================

export interface SkeletonGroupProps {
  count?: number;
  variant?: 'text' | 'card' | 'avatar' | 'list-item';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonGroup({
  count = 3,
  variant = 'text',
  animated = true,
  style,
}: SkeletonGroupProps) {
  const renderSkeleton = (index: number) => {
    switch (variant) {
      case 'avatar':
        return (
          <Skeleton key={index} width={48} height={48} borderRadius={24} animated={animated} />
        );

      case 'card':
        return (
          <View key={index} style={styles.skeletonCard}>
            <Skeleton width="100%" height={120} borderRadius={12} animated={animated} />
            <View style={styles.skeletonCardContent}>
              <Skeleton width="60%" height={16} animated={animated} />
              <Skeleton width="80%" height={12} animated={animated} />
            </View>
          </View>
        );

      case 'list-item':
        return (
          <View key={index} style={styles.skeletonListItem}>
            <Skeleton width={48} height={48} borderRadius={24} animated={animated} />
            <View style={styles.skeletonListItemContent}>
              <Skeleton width="70%" height={14} animated={animated} />
              <Skeleton width="50%" height={12} animated={animated} />
            </View>
          </View>
        );

      case 'text':
      default:
        return (
          <Skeleton
            key={index}
            width={index === count - 1 ? '60%' : '100%'}
            height={14}
            animated={animated}
            style={{ marginBottom: index < count - 1 ? 8 : 0 }}
          />
        );
    }
  };

  return (
    <View style={style}>{Array.from({ length: count }).map((_, i) => renderSkeleton(i))}</View>
  );
}

// ============================================================================
// Success Animation Component
// ============================================================================

export function SuccessAnimation({
  visible,
  size = 80,
  color = '#10b981',
  onComplete,
  style,
}: SuccessAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const ringScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset
      scale.value = 0;
      opacity.value = 0;
      checkProgress.value = 0;
      ringScale.value = 0;

      // Animate
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, SPRING_PRESETS.bouncy);
      ringScale.value = withSpring(1, { ...SPRING_PRESETS.bouncy, damping: 8 });

      // Checkmark animation
      checkProgress.value = withDelay(
        200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        })
      );

      // Haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [0, 0.5, 1], [0, 1, 0.6]),
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[styles.feedbackContainer, { width: size, height: size }, style, containerStyle]}
    >
      {/* Ring animation */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            borderColor: color,
          },
          ringStyle,
        ]}
      />

      {/* Circle background */}
      <View
        style={[
          styles.feedbackCircle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      >
        {/* Checkmark */}
        <Animated.Text style={[styles.feedbackIcon, { fontSize: size * 0.5 }]}>✓</Animated.Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Error Animation Component
// ============================================================================

export function ErrorAnimation({
  visible,
  size = 80,
  color = '#ef4444',
  shake = true,
  onComplete,
  style,
}: ErrorAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset
      scale.value = 0;
      opacity.value = 0;
      rotation.value = 0;

      // Animate
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, SPRING_PRESETS.bouncy);

      // Shake animation
      if (shake) {
        rotation.value = withDelay(
          200,
          withSequence(
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(0, { duration: 50 }, () => {
              if (onComplete) {
                runOnJS(onComplete)();
              }
            })
          )
        );
      }

      // Haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible, shake]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View
      style={[styles.feedbackContainer, { width: size, height: size }, style, containerStyle]}
    >
      <View
        style={[
          styles.feedbackCircle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      >
        <Animated.Text style={[styles.feedbackIcon, { fontSize: size * 0.5 }]}>✕</Animated.Text>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Loading Animation Component
// ============================================================================

export interface LoadingAnimationProps {
  visible: boolean;
  size?: number;
  color?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  style?: StyleProp<ViewStyle>;
}

export function LoadingAnimation({
  visible,
  size = 40,
  color = '#10b981',
  variant = 'spinner',
  style,
}: LoadingAnimationProps) {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });

      if (variant === 'spinner') {
        rotation.value = withRepeat(
          withTiming(360, { duration: 1000, easing: Easing.linear }),
          -1,
          false
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      cancelAnimation(rotation);
    }

    return () => {
      cancelAnimation(rotation);
    };
  }, [visible, variant]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!visible && opacity.value === 0) return null;

  const renderContent = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Animated.View
            style={[
              styles.spinner,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: size / 10,
                borderColor: color,
                borderTopColor: 'transparent',
              },
              spinnerStyle,
            ]}
          />
        );

      case 'dots':
        return (
          <View style={[styles.dotsContainer, { gap: size / 4 }]}>
            {[0, 1, 2].map((i) => (
              <LoadingDot key={i} index={i} size={size / 4} color={color} />
            ))}
          </View>
        );

      case 'pulse':
        return <PulsingCircle size={size} color={color} />;

      case 'bars':
        return (
          <View style={[styles.barsContainer, { gap: size / 8 }]}>
            {[0, 1, 2, 3].map((i) => (
              <LoadingBar key={i} index={i} width={size / 6} height={size} color={color} />
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.loadingContainer, style, containerStyle]}>
      {renderContent()}
    </Animated.View>
  );
}

// Loading helpers
function LoadingDot({ index, size, color }: { index: number; size: number; color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(withTiming(1.5, { duration: 300 }), withTiming(1, { duration: 300 })),
        -1,
        false
      )
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

function LoadingBar({
  index,
  width,
  height,
  color,
}: {
  index: number;
  width: number;
  height: number;
  color: string;
}) {
  const scaleY = useSharedValue(0.4);

  useEffect(() => {
    scaleY.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.4, { duration: 300 })),
        -1,
        false
      )
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: width / 2, backgroundColor: color }, animatedStyle]}
    />
  );
}

function PulsingCircle({ size, color }: { size: number; color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
      <View
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size * 0.3,
          backgroundColor: color,
          position: 'absolute',
          top: size * 0.2,
          left: size * 0.2,
        }}
      />
    </View>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

export function EmptyState({
  icon,
  title,
  description,
  action,
  animated = true,
  style,
}: EmptyStateProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const iconFloat = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0, SPRING_PRESETS.gentle);

      // Floating icon animation
      iconFloat.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      opacity.value = 1;
      translateY.value = 0;
    }
  }, [animated]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat.value }],
  }));

  return (
    <Animated.View style={[styles.emptyState, style, containerStyle]}>
      {icon && <Animated.View style={[styles.emptyStateIcon, iconStyle]}>{icon}</Animated.View>}
      {title && <Animated.Text style={styles.emptyStateTitle}>{title}</Animated.Text>}
      {description && (
        <Animated.Text style={styles.emptyStateDescription}>{description}</Animated.Text>
      )}
      {action && <View style={styles.emptyStateAction}>{action}</View>}
    </Animated.View>
  );
}

// ============================================================================
// Ripple Effect Component
// ============================================================================

export function Ripple({
  color = 'rgba(255, 255, 255, 0.3)',
  duration = 600,
  style,
  children,
  onPress,
}: RippleProps) {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
  let rippleId = 0;

  const handlePress = useCallback(
    (event: any) => {
      const { locationX, locationY } = event.nativeEvent;

      const newRipple = {
        id: rippleId++,
        x: locationX,
        y: locationY,
      };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, duration);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    },
    [duration, onPress]
  );

  return (
    <Pressable onPress={handlePress} style={[styles.rippleContainer, style]}>
      {children}
      {ripples.map((ripple) => (
        <RippleCircle key={ripple.id} x={ripple.x} y={ripple.y} color={color} duration={duration} />
      ))}
    </Pressable>
  );
}

function RippleCircle({
  x,
  y,
  color,
  duration,
}: {
  x: number;
  y: number;
  color: string;
  duration: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(4, { duration, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x - 25 }, { translateY: y - 25 }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.rippleCircle, { backgroundColor: color }, animatedStyle]} />;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  skeleton: {
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
  },
  shimmer: {
    height: '100%',
  },
  skeletonCard: {
    marginBottom: 16,
  },
  skeletonCardContent: {
    marginTop: 12,
    gap: 8,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonListItemContent: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  feedbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIcon: {
    color: '#ffffff',
    fontWeight: '700',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {},
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateAction: {
    marginTop: 24,
  },
  rippleContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  rippleCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});

// ============================================================================
// Default Export
// ============================================================================

const FeedbackSystem = {
  PressableFeedback,
  Skeleton,
  SkeletonGroup,
  SuccessAnimation,
  ErrorAnimation,
  LoadingAnimation,
  EmptyState,
  Ripple,
};

export default FeedbackSystem;
