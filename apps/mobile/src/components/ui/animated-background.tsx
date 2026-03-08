/**
 * Ambient animated background with drifting gradient orbs.
 * Lightweight alternative to canvas particles for mobile.
 * @module components/ui/AnimatedBackground
 */
import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';

interface AnimatedBackgroundProps {
  /** Effect intensity: full, subtle, or off */
  intensity?: 'full' | 'subtle' | 'off';
  /** Additional container styles */
  style?: ViewStyle;
}

const ORB_CONFIGS = [
  {
    color: 'rgba(139, 92, 246, 0.12)',
    size: 280,
    top: -60,
    left: -40,
    driftX: 20,
    driftY: 15,
    duration: 22000,
  },
  {
    color: 'rgba(16, 185, 129, 0.10)',
    size: 240,
    bottom: -40,
    right: -30,
    driftX: -18,
    driftY: -12,
    duration: 26000,
  },
  {
    color: 'rgba(6, 182, 212, 0.08)',
    size: 200,
    top: '40%',
    left: '30%',
    driftX: 15,
    driftY: -20,
    duration: 20000,
  },
] as const;

/**
 * Animated gradient orbs that drift behind content.
 * All animations on native thread via useAnimatedStyle.
 */
export default function AnimatedBackground({
  intensity = 'subtle',
  style,
}: AnimatedBackgroundProps) {
  const reducedMotion = useReducedMotion();

  if (intensity === 'off') return null;

  const opacityMultiplier = intensity === 'full' ? 1 : 0.6;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, style]} pointerEvents="none">
      {ORB_CONFIGS.map((orb, i) => (
        <Orb
          key={i}
          {...orb}
          opacityMultiplier={opacityMultiplier}
          shouldAnimate={!reducedMotion}
        />
      ))}
    </Animated.View>
  );
}

interface OrbProps {
  color: string;
  size: number;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  driftX: number;
  driftY: number;
  duration: number;
  opacityMultiplier: number;
  shouldAnimate: boolean;
}

/** Single gradient orb with drift + scale pulse animation. */
function Orb({
  color,
  size,
  top,
  bottom,
  left,
  right,
  driftX,
  driftY,
  duration,
  opacityMultiplier,
  shouldAnimate,
}: OrbProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!shouldAnimate) return;
    translateX.value = withRepeat(
      withSequence(
        withTiming(driftX, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-driftX, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(driftY, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(-driftY, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [shouldAnimate, translateX, translateY, scale, driftX, driftY, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: opacityMultiplier,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- position values may be string or number from config
          top: top as number | undefined,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          bottom: bottom as number | undefined,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          left: left as number | undefined,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          right: right as number | undefined,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
