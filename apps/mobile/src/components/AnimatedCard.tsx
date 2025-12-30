/**
 * AnimatedCard - A reusable animated container component
 * 
 * Provides smooth fade-in and scale animations for card-like UI elements.
 * Supports press feedback and customizable animation timing.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
  StyleSheet,
  StyleProp,
} from 'react-native';
import { timings, easings, pressAnimation } from '../lib/animations';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  delay?: number;
  animateOnMount?: boolean;
  pressable?: boolean;
}

export default function AnimatedCard({
  children,
  style,
  onPress,
  disabled = false,
  delay = 0,
  animateOnMount = true,
  pressable = true,
}: AnimatedCardProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(animateOnMount ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animateOnMount ? 20 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const { pressIn, pressOut } = pressAnimation(scale);

  useEffect(() => {
    if (animateOnMount) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: timings.normal,
          delay,
          easing: easings.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: timings.normal,
          delay,
          easing: easings.easeOut,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateOnMount, delay]);

  const animatedStyle = {
    opacity,
    transform: [
      { translateY },
      { scale },
    ],
  };

  const content = (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!onPress || disabled || !pressable) {
    return content;
  }

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
    >
      {content}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
