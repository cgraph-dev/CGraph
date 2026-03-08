/**
 * Reusable button component with multiple variants, sizes, loading state, and press animations.
 * @module components/Button
 */
import React, { ReactNode, useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { springs } from '@cgraph/animation-constants';
import { useThemeStore } from '@/stores';
import AnimatedButton from './animated-button';

interface ButtonProps {
  /** Button text */
  children: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Additional container styles */
  style?: ViewStyle;
  /** Additional text styles */
  textStyle?: TextStyle;
  /** Icon element to show before text */
  icon?: ReactNode;
  /** Enable premium animated effects (default true) */
  animated?: boolean;
}

/**
 * Reusable button with haptic feedback and spring press animation.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
  icon,
  animated = true,
}: ButtonProps) {
  const { colors } = useThemeStore();
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!reducedMotion) {
      scale.value = withSpring(0.96, {
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

  const variantStyles: Record<NonNullable<ButtonProps['variant']>, ViewStyle> = {
    primary: { backgroundColor: disabled ? colors.primary + '80' : colors.primary },
    secondary: { backgroundColor: colors.surfaceSecondary },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: disabled ? '#ef444480' : '#ef4444' },
  };

  const textColors: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: '#ffffff',
    danger: '#ffffff',
    secondary: colors.text,
    outline: colors.primary,
    ghost: colors.primary,
  };

  const sizeStyles: Record<NonNullable<ButtonProps['size']>, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 24 },
  };

  const textSizes: Record<NonNullable<ButtonProps['size']>, number> = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const useEnhanced = animated && !disabled && (variant === 'primary' || variant === 'secondary');
  const enhancedIntensity = variant === 'primary' ? 'full' : 'subtle';

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text
            style={[
              styles.text,
              { color: textColors[variant], fontSize: textSizes[size] },
              textStyle,
            ]}
          >
            {children}
          </Text>
        </View>
      )}
    </>
  );

  if (useEnhanced) {
    return (
      <AnimatedButton
        onPress={onPress}
        disabled={disabled || loading}
        intensity={enhancedIntensity}
        borderRadius={8}
        style={style}
      >
        <View
          style={[
            styles.button,
            variantStyles[variant],
            sizeStyles[size],
            fullWidth && styles.fullWidth,
          ]}
        >
          {buttonContent}
        </View>
      </AnimatedButton>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={children}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.button,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {buttonContent}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
  },
});
