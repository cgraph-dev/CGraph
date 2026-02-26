/**
 * Pulsing dot indicator component for online status.
 * @module screens/community/whos-online-screen/components/pulsing-dot
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

/**
 * PulsingDot - Animated indicator for live/online status
 * Features pulse, rotation, and glow effects
 */
export function PulsingDot() {
  const pulseAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0.5);

  useEffect(() => {
    // Pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: durations.extended.ms, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: durations.extended.ms, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Rotation animation
    rotateAnim.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    // Glow animation
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: durations.verySlow.ms }),
        withTiming(0.3, { duration: durations.verySlow.ms })
      ),
      -1,
      false
    );
  }, [pulseAnim, rotateAnim, glowAnim]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotateAnim.value, [0, 1], [0, 360])}deg` }],
    opacity: glowAnim.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: glowAnim.value,
  }));

  return (
    <View style={styles.pulsingDotContainer}>
      {/* Outer rotating ring */}
      <Animated.View
        style={[
          styles.pulsingDotRing,
          ringStyle,
        ]}
      />
      {/* Pulsing glow */}
      <Animated.View
        style={[
          styles.pulsingDotOuter,
          pulseStyle,
        ]}
      />
      {/* Core dot */}
      <View style={styles.pulsingDotInner} />
    </View>
  );
}

const styles = StyleSheet.create({
  pulsingDotContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDotRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
  pulsingDotOuter: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
});
