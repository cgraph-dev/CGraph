/**
 * AnimatedSubmitButton - Animated submit button with glow and shimmer effects
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SubmitButtonProps } from '../types';
import { styles } from '../styles';
import { SCREEN_WIDTH } from '../constants';

/**
 * Animated Submit Button component.
 *
 */
export function AnimatedSubmitButton({ onPress, isDisabled, isLoading }: SubmitButtonProps) {
  const scaleAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    if (!isDisabled && !isLoading) {
      // Subtle pulse when enabled
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: durations.ambient.ms }),
          withTiming(0.5, { duration: durations.ambient.ms })
        ),
        -1
      );

      // Shimmer effect
      shimmerAnim.value = withRepeat(withTiming(1, { duration: 2500 }), -1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisabled, isLoading]);

  const handlePressIn = () => {
    if (isDisabled || isLoading) return;
    scaleAnim.value = withSpring(0.95, { damping: 8, stiffness: 100 });
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1, { damping: 4, stiffness: 80 });
  };

  const handlePress = () => {
    if (isDisabled || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const scaleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const shimmerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerAnim.value, [0, 1], [-200, SCREEN_WIDTH]) }],
  }));

  return (
    <Animated.View style={[styles.submitButtonWrapper, scaleAnimStyle]}>
      {/* Glow effect */}
      {!isDisabled && <Animated.View style={[styles.submitButtonGlow, glowAnimStyle]} />}

      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={isDisabled || isLoading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={isDisabled ? ['#374151', '#1F2937'] : ['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitButton}
        >
          {/* Shimmer overlay */}
          {!isDisabled && !isLoading && (
            <Animated.View style={[styles.shimmerOverlay, shimmerAnimStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}

          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color={isDisabled ? '#6B7280' : '#FFF'} />
              <Text style={[styles.submitButtonText, isDisabled && { color: '#6B7280' }]}>
                Create Post
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
