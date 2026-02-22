import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  size: number;
  color: string;
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

  const particles = useRef<Particle[]>(
    Array.from({ length: count }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(Math.random() * 150),
      opacity: new Animated.Value(Math.random()),
      size: 4 + Math.random() * 6,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    }))
  ).current;

  useEffect(() => {
    particles.forEach((particle, index) => {
      const animateParticle = () => {
        const duration = 2500 + Math.random() * 2000;

        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -30,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset particle to bottom and restart animation
          particle.x.setValue(Math.random() * SCREEN_WIDTH);
          particle.y.setValue(150 + Math.random() * 50);
          particle.opacity.setValue(0.5 + Math.random() * 0.5);
          animateParticle();
        });
      };

      // Stagger particle animations
      setTimeout(() => animateParticle(), index * 150);
    });
  }, [particles]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [{ translateX: particle.x }, { translateY: particle.y }],
            },
          ]}
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
