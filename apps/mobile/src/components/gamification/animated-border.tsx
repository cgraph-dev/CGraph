/**
 * AnimatedBorder - Mobile (React Native)
 *
 * Renders animated avatar borders using React Native Reanimated + SVG
 * for 60fps performance on mobile devices.
 *
 * Supports all 13 border animation types:
 * - none, static: no animation
 * - pulse, rotate, shimmer, wave, breathe, spin, rainbow, particles, glow, flow, spark
 *
 * Uses `useReducedMotion()` to respect accessibility preferences.
 *
 * @module components/gamification/animated-border
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import LottieView from 'lottie-react-native';

// ── Types ──────────────────────────────────────────────────────────────

export type BorderAnimationType =
  | 'none'
  | 'static'
  | 'pulse'
  | 'rotate'
  | 'shimmer'
  | 'wave'
  | 'breathe'
  | 'spin'
  | 'rainbow'
  | 'particles'
  | 'glow'
  | 'flow'
  | 'spark'
  | 'lottie';

export interface AnimatedBorderProps {
  /** Animation type */
  animationType: BorderAnimationType;
  /** Primary border color */
  borderColor?: string;
  /** Secondary color */
  borderColorSecondary?: string;
  /** Accent color */
  borderColorAccent?: string;
  /** Size in pixels */
  size?: number;
  /** Border width in pixels */
  borderWidth?: number;
  /** Lottie JSON URL for lottie animation type */
  lottieUrl?: string;
  /** Content to render inside */
  children: React.ReactNode;
}

const AnimatedView = Animated.createAnimatedComponent(View);

// ── Animated Wrapper ───────────────────────────────────────────────────

/**
 * useAnimatedBorderStyle hook.
 * Returns an animated style based on the animation type.
 */
function useAnimatedBorderStyle(
  animationType: BorderAnimationType,
  isReducedMotion: boolean,
) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (isReducedMotion || animationType === 'none' || animationType === 'static') {
      return;
    }

    switch (animationType) {
      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.85, { duration: 1000 }),
            withTiming(1, { duration: 1000 }),
          ),
          -1,
          false,
        );
        break;

      case 'rotate':
      case 'spin':
        rotation.value = withRepeat(
          withTiming(360, { duration: 3000, easing: Easing.linear }),
          -1,
          false,
        );
        break;

      case 'shimmer':
        progress.value = withRepeat(
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
        break;

      case 'wave':
        rotation.value = withRepeat(
          withSequence(
            withTiming(2, { duration: 750 }),
            withTiming(-2, { duration: 1500 }),
            withTiming(0, { duration: 750 }),
          ),
          -1,
          false,
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: 1500 }),
            withTiming(1, { duration: 1500 }),
          ),
          -1,
          false,
        );
        break;

      case 'breathe':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.98, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
        break;

      case 'rainbow':
        rotation.value = withRepeat(
          withTiming(360, { duration: 4000, easing: Easing.linear }),
          -1,
          false,
        );
        break;

      case 'glow':
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.7, { duration: 1250 }),
            withTiming(1, { duration: 1250 }),
          ),
          -1,
          false,
        );
        break;

      case 'flow':
        rotation.value = withRepeat(
          withSequence(
            withTiming(5, { duration: 1667 }),
            withTiming(-3, { duration: 1667 }),
            withTiming(0, { duration: 1666 }),
          ),
          -1,
          false,
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 2500 }),
            withTiming(0.99, { duration: 2500 }),
          ),
          -1,
          false,
        );
        break;

      case 'spark':
        scale.value = withRepeat(
          withSequence(
            withDelay(2400, withTiming(1.08, { duration: 150 })),
            withTiming(1, { duration: 150 }),
            withDelay(300, withTiming(1.04, { duration: 150 })),
            withTiming(1, { duration: 150 }),
          ),
          -1,
          false,
        );
        break;

      case 'particles':
        // Particles use a slow rotation + gentle pulse
        rotation.value = withRepeat(
          withTiming(360, { duration: 6000, easing: Easing.linear }),
          -1,
          false,
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 1500 }),
            withTiming(1, { duration: 1500 }),
          ),
          -1,
          false,
        );
        break;
    }
  }, [animationType, isReducedMotion, progress, scale, rotation, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * AnimatedBorder component for React Native.
 *
 * Wraps children with an animated SVG border ring.
 */
export default function AnimatedBorder({
  animationType,
  borderColor = '#6366f1',
  borderColorSecondary,
  borderColorAccent,
  size = 80,
  borderWidth = 3,
  lottieUrl,
  children,
}: AnimatedBorderProps) {
  const isReducedMotion = useReducedMotion();
  const isAnimated =
    !isReducedMotion &&
    animationType !== 'none' &&
    animationType !== 'static';

  const animatedStyle = useAnimatedBorderStyle(
    animationType,
    isReducedMotion ?? false,
  );

  const innerSize = size - borderWidth * 2;
  const center = size / 2;
  const radius = (size - borderWidth) / 2;

  const secondaryColor = borderColorSecondary ?? borderColor;
  const accentColor = borderColorAccent ?? secondaryColor;

  const containerStyle = useMemo(
    () => ({
      width: size,
      height: size,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }),
    [size],
  );

  // Lottie border: render LottieView behind avatar
  if (animationType === 'lottie' && lottieUrl && !isReducedMotion) {
    return (
      <View style={containerStyle}>
        <LottieView
          source={{ uri: lottieUrl }}
          style={[StyleSheet.absoluteFill, { width: size, height: size }]}
          autoPlay
          loop
          renderMode="AUTOMATIC"
        />
        <View
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      </View>
    );
  }

  // For non-animated types, render a simple View
  if (animationType === 'none') {
    return (
      <View style={containerStyle}>
        {children}
      </View>
    );
  }

  return (
    <AnimatedView style={[containerStyle, isAnimated ? animatedStyle : undefined]}>
      {/* SVG border ring */}
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={borderColor} />
            <Stop offset="0.5" stopColor={secondaryColor} />
            <Stop offset="1" stopColor={accentColor} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#borderGrad)"
          strokeWidth={borderWidth}
          fill="none"
        />
      </Svg>

      {/* Inner content */}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </AnimatedView>
  );
}
