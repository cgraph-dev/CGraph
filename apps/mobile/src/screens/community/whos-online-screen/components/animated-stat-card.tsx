import { durations } from '@cgraph/animation-constants';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  useAnimatedReaction,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface AnimatedStatCardProps {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
}

/**
 * AnimatedStatCard - Animated statistics display card
 * Features count-up animation, icon bounce, and press feedback
 */
export function AnimatedStatCard({ label, value, icon, color, index }: AnimatedStatCardProps) {
  const scaleAnim = useSharedValue(0);
  const countAnim = useSharedValue(0);
  const iconBounce = useSharedValue(1);
  const [displayValue, setDisplayValue] = useState(0);

  const updateDisplayValue = useCallback((v: number) => {
    setDisplayValue(Math.round(v));
  }, []);

  useAnimatedReaction(
    () => countAnim.value,
    (currentValue) => {
      runOnJS(updateDisplayValue)(currentValue);
    }
  );

  useEffect(() => {
    const delay = index * 100;

    // Entry animation
    scaleAnim.value = withDelay(delay, withSpring(1, { damping: 5, stiffness: 50 }));

    // Count up animation
    countAnim.value = withDelay(
      delay + 200,
      withTiming(value, { duration: durations.ambient.ms, easing: Easing.out(Easing.cubic) })
    );

    // Icon bounce
    setTimeout(() => {
      iconBounce.value = withSequence(
        withSpring(1.3, { damping: 3, stiffness: 100 }),
        withSpring(1, { damping: 4, stiffness: 80 })
      );
    }, delay + 300);
  }, [value, index, scaleAnim, countAnim, iconBounce]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    scaleAnim.value = withSequence(
      withSpring(0.95, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 4, stiffness: 80 })
    );
  };

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconBounce.value }],
  }));

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.statCard,
          {
            borderLeftColor: color,
          },
          cardStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <Ionicons name={icon} size={22} color={color} />
        </Animated.View>
        <Text style={styles.statValue}>{displayValue}</Text>
        <Text style={styles.statLabel}>{label}</Text>

        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={[`${color}10`, 'transparent']}
          style={styles.statCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
});
