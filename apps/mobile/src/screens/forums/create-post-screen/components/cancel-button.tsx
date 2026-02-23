/**
 * CancelButton - Animated cancel button
 */

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { styles } from '../styles';

interface CancelButtonProps {
  onPress: () => void;
}

export function CancelButton({ onPress }: CancelButtonProps) {
  const scaleAnim = useSharedValue(1);

  const scaleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.95, { damping: 8, stiffness: 100 });
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1, { damping: 4, stiffness: 80 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={[{ flex: 1 }, scaleAnimStyle]}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Ionicons name="close" size={20} color="#9CA3AF" />
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
