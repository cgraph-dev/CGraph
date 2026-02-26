/**
 * Animated level badge component with glow and pulse effects.
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationColors } from '@/lib/animations/animation-engine';

interface LevelBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
}

const DIMENSIONS = {
  small: { outer: 40, inner: 36, fontSize: 14, glow: 6 },
  medium: { outer: 52, inner: 46, fontSize: 18, glow: 8 },
  large: { outer: 72, inner: 64, fontSize: 24, glow: 12 },
};

export function LevelBadge({ level, size = 'medium' }: LevelBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const dimensions = DIMENSIONS[size];

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: durations.ambient.ms,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: durations.ambient.ms,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: durations.loop.ms,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: durations.loop.ms,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.levelGlow,
          {
            width: dimensions.outer + dimensions.glow * 2,
            height: dimensions.outer + dimensions.glow * 2,
            borderRadius: (dimensions.outer + dimensions.glow * 2) / 2,
            opacity: glowAnim,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.levelBadgeOuter,
          {
            width: dimensions.outer,
            height: dimensions.outer,
            borderRadius: dimensions.outer / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[AnimationColors.primary, '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.levelBadgeGradient,
            {
              width: dimensions.outer,
              height: dimensions.outer,
              borderRadius: dimensions.outer / 2,
            },
          ]}
        >
          <View
            style={[
              styles.levelBadgeInner,
              {
                width: dimensions.inner,
                height: dimensions.inner,
                borderRadius: dimensions.inner / 2,
              },
            ]}
          >
            <Text style={[styles.levelText, { fontSize: dimensions.fontSize }]}>
              {level}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  levelGlow: { position: 'absolute', backgroundColor: AnimationColors.primary },
  levelBadgeOuter: {
    shadowColor: AnimationColors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  levelBadgeGradient: { alignItems: 'center', justifyContent: 'center' },
  levelBadgeInner: {
    backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center',
  },
  levelText: {
    fontWeight: '800', color: '#ffffff',
    textShadowColor: AnimationColors.primary,
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
  },
});
