import React, { useRef, useEffect } from 'react';
import { StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WaveEffectProps {
  scrollY: Animated.Value;
}

/**
 * WaveEffect - Animated gradient waves that respond to scroll
 * Creates a flowing wave effect in the background
 */
export function WaveEffect({ scrollY }: WaveEffectProps) {
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(wave1, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(wave2, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [wave1, wave2]);

  const wave1TranslateX = wave1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
  });

  const wave2TranslateX = wave2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
  });

  const waveOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0.3, 0.1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.waveContainer, { opacity: waveOpacity }]}>
      <Animated.View style={[styles.wave, { transform: [{ translateX: wave1TranslateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(16, 185, 129, 0.2)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.waveGradient}
        />
      </Animated.View>
      <Animated.View
        style={[styles.wave, styles.wave2, { transform: [{ translateX: wave2TranslateX }] }]}
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
