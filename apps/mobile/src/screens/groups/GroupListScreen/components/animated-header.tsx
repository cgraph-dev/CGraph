/**
 * AnimatedHeader Component
 *
 * Header with animated create button.
 */

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { AnimatedHeaderProps } from '../types';

export function AnimatedHeader({ colors, onCreatePress }: AnimatedHeaderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onCreatePress();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <TouchableOpacity onPress={handlePress} style={styles.headerButton}>
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }, { rotate: rotation }],
        }}
      >
        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.headerButtonGradient}>
          <Ionicons name="add" size={20} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 16,
  },
  headerButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
