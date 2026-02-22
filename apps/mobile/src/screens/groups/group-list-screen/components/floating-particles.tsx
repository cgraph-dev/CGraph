/**
 * FloatingParticles Component
 *
 * Animated particle effects for active groups.
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FloatingParticlesProps } from '../types';

export function FloatingParticles({ isActive }: FloatingParticlesProps) {
  const particles = useRef(
    Array.from({ length: 6 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!isActive) return;

    particles.forEach((particle, index) => {
      const delay = index * 200;
      const duration = 2000 + Math.random() * 1000;

      const animate = () => {
        const randomX = (Math.random() - 0.5) * 40;
        const randomY = (Math.random() - 0.5) * 30;

        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.translateX, {
              toValue: randomX,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: randomY,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 0.8 + Math.random() * 0.4,
                duration: duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0.3,
                duration: duration / 2,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.6,
                duration: duration / 3,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: (duration * 2) / 3,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => {
          particle.translateX.setValue(0);
          particle.translateY.setValue(0);
          animate();
        });
      };

      setTimeout(animate, delay);
    });
  }, [isActive, particles]);

  if (!isActive) return null;

  return (
    <View style={styles.particlesContainer}>
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: 10 + (index % 3) * 15,
              top: 10 + Math.floor(index / 3) * 15,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.particleGradient} />
        </Animated.View>
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
