/**
 * StatCard - Animated stat card with glow effects
 *
 * Features:
 * - Entrance animation with spring physics
 * - Press interactions with haptic feedback
 * - Icon rotation on press
 * - Glow effect on interaction
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
  index?: number;
}

/**
 *
 */
export function StatCard({ icon, label, value, color, onPress, index = 0 }: StatCardProps) {
  const scaleAnim = useSharedValue(0.8);
  const opacityAnim = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const glowAnim = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scaleAnim.value = withDelay(index * 100, withSpring(1, { stiffness: 80, damping: 8 }));
    opacityAnim.value = withDelay(index * 100, withTiming(1, { duration: durations.smooth.ms }));
  }, [index]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scaleAnim.value = withSpring(0.95);
    iconRotate.value = withTiming(1, { duration: durations.normal.ms });
    glowAnim.value = withTiming(1, { duration: durations.normal.ms });
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
    iconRotate.value = withTiming(0, { duration: durations.normal.ms });
    glowAnim.value = withTiming(0, { duration: durations.normal.ms });
  };

  const wrapperStyle = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value * 0.3,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(iconRotate.value, [0, 1], [0, 15])}deg` }],
  }));

  const content = (
    <Animated.View
      style={[
        styles.wrapper,
        wrapperStyle,
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: color,
          },
          glowStyle,
        ]}
      />

      <LinearGradient colors={[color + '30', '#1f293780']} style={styles.card}>
        <Animated.View style={iconStyle}>
          { }
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={28} color={color} />
        </Animated.View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    width: (SCREEN_WIDTH - 44) / 2,
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 26,
    opacity: 0,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default StatCard;
