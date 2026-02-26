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

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface AnimatedLevelOrbProps {
  level: number;
  progress: number; // 0-1
}

interface ParticleData {
  angle: number;
  radius: number;
  yTarget: number;
  xTarget: number;
  duration: number;
}

function LevelParticle({ data, index }: { data: ParticleData; index: number }) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const delay = index * 300;
    const d = data.duration;

    const startAnim = () => {
      y.value = 0;
      x.value = 0;
      opacity.value = 0;
      scale.value = 0.5;

      y.value = withDelay(
        delay,
        withRepeat(
          withTiming(data.yTarget, { duration: d, easing: Easing.out(Easing.ease) }),
          -1,
          true
        )
      );
      x.value = withDelay(
        delay,
        withRepeat(
          withTiming(data.xTarget, { duration: d }),
          -1,
          true
        )
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.8, { duration: 500 }),
            withTiming(0, { duration: 1500 })
          ),
          -1,
          false
        )
      );
      scale.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 1000 }),
          -1,
          true
        )
      );
    };

    startAnim();
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: y.value },
      { translateX: x.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, particleStyle]}>
      <Ionicons name="sparkles" size={12} color="#8B5CF6" />
    </Animated.View>
  );
}

/**
 *
 */
export function AnimatedLevelOrb({ level, progress }: AnimatedLevelOrbProps) {
  const rotateAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.5);

  const particlesData = useMemo<ParticleData[]>(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 50;
        return {
          angle,
          radius,
          yTarget: -60 - Math.random() * 30,
          xTarget: Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
          duration: 2000 + Math.random() * 1000,
        };
      }),
    []
  );

  useEffect(() => {
    // Continuous rotation
    rotateAnim.value = withRepeat(
      withTiming(1, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Glow animation
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
    transform: [{ scale: pulseAnim.value + 0.2 }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseAnim.value },
      { rotate: `${interpolate(rotateAnim.value, [0, 1], [0, 360])}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Particles */}
      {particlesData.map((data, i) => (
        <LevelParticle key={i} data={data} index={i} />
      ))}

      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
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
          orbStyle,
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
