/**
 * CancelButton - Animated cancel button
 */

import React, { useRef } from 'react';
import { Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { styles } from '../styles';

interface CancelButtonProps {
  onPress: () => void;
}

export function CancelButton({ onPress }: CancelButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
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
