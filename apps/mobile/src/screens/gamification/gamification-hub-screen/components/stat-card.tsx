/**
 * StatCard - Animated stat card with glow effects
 *
 * Features:
 * - Entrance animation with spring physics
 * - Press interactions with haptic feedback
 * - Icon rotation on press
 * - Glow effect on interaction
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
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

export function StatCard({ icon, label, value, color, onPress, index = 0 }: StatCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  const content = (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: color,
            opacity: Animated.multiply(glowAnim, 0.3),
          },
        ]}
      />

      <LinearGradient colors={[color + '30', '#1f293780']} style={styles.card}>
        <Animated.View style={{ transform: [{ rotate }] }}>
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
