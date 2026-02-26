/**
 * Animated wave effect component for visual flair on the online screen.
 * @module screens/community/whos-online-screen/components/wave-effect
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WaveEffectProps {
  scrollY: SharedValue<number>;
}

/**
 * WaveEffect - Animated gradient waves that respond to scroll
 * Creates a flowing wave effect in the background
 */
export function WaveEffect({ scrollY }: WaveEffectProps) {
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);

  useEffect(() => {
    wave1.value = withRepeat(
      withTiming(1, { duration: durations.cinematic.ms, easing: Easing.linear }),
      -1,
      false
    );

    wave2.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, [wave1, wave2]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [0.3, 0.1], Extrapolation.CLAMP),
  }));

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(wave1.value, [0, 1], [0, -SCREEN_WIDTH]) }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(wave2.value, [0, 1], [0, -SCREEN_WIDTH]) }],
  }));

  return (
    <Animated.View style={[styles.waveContainer, containerStyle]}>
      <Animated.View style={[styles.wave, wave1Style]}>
        <LinearGradient
          colors={['transparent', 'rgba(16, 185, 129, 0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.waveGradient}
        />
      </Animated.View>
      <Animated.View
        style={[styles.wave, styles.wave2, wave2Style]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(139, 92, 246, 0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.waveGradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 2,
    height: '100%',
  },
  wave2: {
    top: 20,
  },
  waveGradient: {
    flex: 1,
  },
});
