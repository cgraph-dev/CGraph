/**
 * Enhanced animated button with gradient border, glow press effect,
 * idle shimmer, and spring physics.
 * @module components/AnimatedButton
 */
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolateColor,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { springs, buttonPresets } from '@cgraph/animation-constants';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Full gradient + glow effects vs subtle spring-only */
  intensity?: 'full' | 'subtle';
  style?: ViewStyle;
  borderRadius?: number;
}

const GLOW_COLOR = 'rgba(16, 185, 129, 0.35)';
const PRESS_SCALE = buttonPresets.tap.scale;

/**
 * Premium animated button with gradient border, glow press, idle shimmer,
 * and enhanced haptic feedback. All animations on UI thread.
 */
export default function AnimatedButton({
  children,
  onPress,
  disabled = false,
  intensity = 'full',
  style,
  borderRadius = 8,
}: AnimatedButtonProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const glowRadius = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);
  const gradientRotation = useSharedValue(0);

  // Idle gradient rotation + shimmer
  useEffect(() => {
    if (reducedMotion || intensity !== 'full') return;
    gradientRotation.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    shimmerProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [reducedMotion, intensity, gradientRotation, shimmerProgress]);

  const handlePressIn = useCallback(() => {
    if (!reducedMotion) {
      scale.value = withSpring(PRESS_SCALE, {
        stiffness: springs.snappy.stiffness,
        damping: springs.snappy.damping,
      });
      if (intensity === 'full') {
        glowRadius.value = withSpring(16, { damping: 12 });
        glowOpacity.value = withSpring(1, { damping: 12 });
      }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [reducedMotion, scale, glowRadius, glowOpacity, intensity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      stiffness: springs.snappy.stiffness,
      damping: springs.snappy.damping,
    });
    glowRadius.value = withSpring(0, { damping: 15 });
    glowOpacity.value = withSpring(0, { damping: 15 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [scale, glowRadius, glowOpacity]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity.value,
    shadowRadius: glowRadius.value,
    elevation: glowRadius.value > 0 ? 8 : 0,
  }));

  const shimmerOverlayStyle = useAnimatedStyle(() => ({
    opacity: shimmerProgress.value * 0.12,
    backgroundColor: interpolateColor(
      shimmerProgress.value,
      [0, 0.5, 1],
      ['rgba(255,255,255,0)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']
    ),
  }));

  // Subtle mode: spring-only, no gradient border
  if (intensity === 'subtle' || reducedMotion) {
    return (
      <Animated.View style={[containerAnimatedStyle, glowAnimatedStyle, style]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[containerAnimatedStyle, styles.wrapper, style]}>
      <Animated.View style={[glowAnimatedStyle, { borderRadius: borderRadius + 2 }]}>
        {/* Gradient border */}
        <LinearGradient
          colors={['#10b981', '#8b5cf6', '#06b6d4', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBorder, { borderRadius: borderRadius + 2, padding: 2 }]}
        >
          {/* Inner content area */}
          <Animated.View style={[styles.innerContainer, { borderRadius }]}>
            {children}
            {/* Shimmer overlay */}
            <Animated.View
              style={[StyleSheet.absoluteFill, { borderRadius }, shimmerOverlayStyle]}
              pointerEvents="none"
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'visible',
  },
  gradientBorder: {
    overflow: 'hidden',
  },
  innerContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
});
