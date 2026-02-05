/**
 * AnimatedLevelOrb - 3D animated level orb with particle effects
 *
 * Features:
 * - Continuous rotation animation
 * - Pulse breathing effect
 * - Glow animation
 * - Floating particles around the orb
 * - Progress ring display
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface AnimatedLevelOrbProps {
  level: number;
  progress: number; // 0-1
}

export function AnimatedLevelOrb({ level, progress }: AnimatedLevelOrbProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  useEffect(() => {
    // Continuous rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Particle animations
    particleAnims.forEach((particle, i) => {
      const delay = i * 300;
      const angle = (i / 8) * Math.PI * 2;
      const radius = 50;

      const animate = () => {
        particle.y.setValue(0);
        particle.x.setValue(0);
        particle.opacity.setValue(0);
        particle.scale.setValue(0.5);

        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -60 - Math.random() * 30,
            duration: 2000 + Math.random() * 1000,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
            duration: 2000 + Math.random() * 1000,
            delay,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: 500,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 1000,
            delay,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      animate();
    });
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Particles */}
      {particleAnims.map((particle, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              opacity: particle.opacity,
              transform: [
                { translateY: particle.y },
                { translateX: particle.x },
                { scale: particle.scale },
              ],
            },
          ]}
        >
          <Ionicons name="sparkles" size={12} color="#8B5CF6" />
        </Animated.View>
      ))}

      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowAnim,
            transform: [{ scale: Animated.add(pulseAnim, 0.2) }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.4)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Main orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            transform: [{ scale: pulseAnim }, { rotate }],
          },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1', '#4F46E5']}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Progress ring */}
          <View style={styles.progressRingContainer}>
            <View
              style={[
                styles.progressRing,
                {
                  borderColor: 'rgba(255,255,255,0.3)',
                },
              ]}
            />
            <View
              style={[
                styles.progressRingFill,
                {
                  borderColor: '#FCD34D',
                  borderTopColor: progress > 0.25 ? '#FCD34D' : 'transparent',
                  borderRightColor: progress > 0.5 ? '#FCD34D' : 'transparent',
                  borderBottomColor: progress > 0.75 ? '#FCD34D' : 'transparent',
                  transform: [{ rotate: `${progress * 360}deg` }],
                },
              ]}
            />
          </View>

          <Text style={styles.orbText}>{level}</Text>
          <Text style={styles.orbLabel}>LEVEL</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    marginVertical: 16,
  },
  particle: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
  },
  progressRingFill: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderLeftColor: 'transparent',
  },
  orbText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  orbLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginTop: -4,
  },
});

export default AnimatedLevelOrb;
