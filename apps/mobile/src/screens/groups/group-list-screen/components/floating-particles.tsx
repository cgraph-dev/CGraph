/**
 * FloatingParticles Component
 *
 * Animated particle effects for active groups.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { FloatingParticlesProps } from '../types';

interface ParticleData {
  left: number;
  top: number;
  randomX: number;
  randomY: number;
  duration: number;
  targetScale: number;
}

function Particle({ data, index }: { data: ParticleData; index: number }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const d = data.duration;
    translateX.value = withDelay(
      index * 200,
      withRepeat(
        withTiming(data.randomX, { duration: d, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      index * 200,
      withRepeat(
        withTiming(data.randomY, { duration: d, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    scale.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(data.targetScale, { duration: d / 2 }),
          withTiming(0.3, { duration: d / 2 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: d / 3 }),
          withTiming(0, { duration: (d * 2) / 3 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: data.left,
          top: data.top,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.particleGradient} />
    </Animated.View>
  );
}

export function FloatingParticles({ isActive }: FloatingParticlesProps) {
  const particlesData = useMemo<ParticleData[]>(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        left: 10 + (index % 3) * 15,
        top: 10 + Math.floor(index / 3) * 15,
        randomX: (Math.random() - 0.5) * 40,
        randomY: (Math.random() - 0.5) * 30,
        duration: 2000 + Math.random() * 1000,
        targetScale: 0.8 + Math.random() * 0.4,
      })),
    []
  );

  if (!isActive) return null;

  return (
    <View style={styles.particlesContainer}>
      {particlesData.map((data, index) => (
        <Particle key={index} data={data} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  particleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
});
