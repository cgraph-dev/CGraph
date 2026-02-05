/**
 * AnimatedSubmitButton - Animated submit button with glow and shimmer effects
 */

import React, { useRef, useEffect } from 'react';
import { Text, TouchableOpacity, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SubmitButtonProps } from '../types';
import { styles } from '../styles';
import { SCREEN_WIDTH } from '../constants';

export function AnimatedSubmitButton({ onPress, isDisabled, isLoading }: SubmitButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDisabled && !isLoading) {
      // Subtle pulse when enabled
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

      // Shimmer effect
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [isDisabled, isLoading]);

  const handlePressIn = () => {
    if (isDisabled || isLoading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (isDisabled || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, SCREEN_WIDTH],
  });

  return (
    <Animated.View style={[styles.submitButtonWrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Glow effect */}
      {!isDisabled && <Animated.View style={[styles.submitButtonGlow, { opacity: glowAnim }]} />}

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
            <Animated.View
              style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslateX }] }]}
            >
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
