import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(1)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const delay = index * 100;

    // Entry animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 50,
      delay,
      useNativeDriver: true,
    }).start();

    // Count up animation
    Animated.timing(countAnim, {
      toValue: value,
      duration: 1500,
      delay: delay + 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Icon bounce
    setTimeout(() => {
      Animated.sequence([
        Animated.spring(iconBounce, {
          toValue: 1.3,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(iconBounce, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay + 300);

    // Update display value
    const listener = countAnim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => countAnim.removeListener(listener);
  }, [value, index, scaleAnim, countAnim, iconBounce]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.statCard,
          {
            borderLeftColor: color,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: iconBounce }] }}>
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
