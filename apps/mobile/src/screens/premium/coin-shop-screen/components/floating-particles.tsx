import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ParticleData {
  size: number;
  color: string;
}

interface ParticleItemProps {
  index: number;
  size: number;
  color: string;
}

function ParticleItem({ index, size, color }: ParticleItemProps) {
  const x = useSharedValue(Math.random() * SCREEN_WIDTH);
  const y = useSharedValue(Math.random() * 150);
  const opacity = useSharedValue(Math.random());

  useEffect(() => {
    const animateParticle = () => {
      const duration = 2500 + Math.random() * 2000;
      y.value = withTiming(-30, { duration }, (finished) => {
        if (finished) {
          x.value = Math.random() * SCREEN_WIDTH;
          y.value = 150 + Math.random() * 50;
          opacity.value = 0.5 + Math.random() * 0.5;
          runOnJS(animateParticle)();
        }
      });
      opacity.value = withTiming(0, { duration });
    };

    const timeout = setTimeout(animateParticle, index * 150);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface FloatingParticlesProps {
  count?: number;
}

/**
 * Floating Particles Component
 *
 * Creates a floating particle effect for visual enhancement.
 * Features:
 * - Multiple animated particles (sparkles/stars)
 * - Random positions and movement patterns
 * - Continuous opacity animations
 * - Golden/amber color scheme
 */
export function FloatingParticles({ count = 12 }: FloatingParticlesProps) {
  const particleColors = ['#f59e0b', '#fbbf24', '#fcd34d'];

  const particles = useMemo<ParticleData[]>(
    () =>
      Array.from({ length: count }, () => ({
        size: 4 + Math.random() * 6,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      })),
    [count]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle, index) => (
        <ParticleItem
          key={index}
          index={index}
          size={particle.size}
          color={particle.color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});

export default FloatingParticles;
