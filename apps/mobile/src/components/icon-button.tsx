/**
 * Icon button component wrapping Ionicons with configurable size, variant, and badge support.
 * @module components/IconButton
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { springs } from '@cgraph/animation-constants';
import { useThemeStore } from '@/stores';

interface IconButtonProps {
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  /** Press handler */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Icon color override */
  color?: string;
  /** Accessibility label (required for icon-only buttons) */
  accessibilityLabel?: string;
}

const SIZES = {
  sm: { button: 32, icon: 18 },
  md: { button: 40, icon: 22 },
  lg: { button: 48, icon: 26 },
};

/**
 * Icon button with haptic feedback and spring press animation.
 */
export default function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  onPress,
  disabled = false,
  style,
  color,
  accessibilityLabel,
}: IconButtonProps) {
  const { colors } = useThemeStore();
  const sizeConfig = SIZES[size];
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!reducedMotion) {
      scale.value = withSpring(0.9, {
        stiffness: springs.snappy.stiffness,
        damping: springs.snappy.damping,
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [reducedMotion, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      stiffness: springs.snappy.stiffness,
      damping: springs.snappy.damping,
    });
  }, [scale]);

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceSecondary;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'danger':
        return '#ef4444';
      case 'ghost':
        return 'transparent';
      default:
        return colors.surfaceSecondary;
    }
  };

  const getIconColor = () => {
    if (color) return color;
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#ffffff';
      case 'ghost':
        return colors.text;
      default:
        return colors.text;
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? icon.replace(/-/g, ' ')}
        accessibilityState={{ disabled }}
        style={[
          styles.button,
          {
            width: sizeConfig.button,
            height: sizeConfig.button,
            borderRadius: sizeConfig.button / 2,
            backgroundColor: getBackgroundColor(),
          },
          style,
        ]}
      >
        <Ionicons name={icon} size={sizeConfig.icon} color={getIconColor()} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
