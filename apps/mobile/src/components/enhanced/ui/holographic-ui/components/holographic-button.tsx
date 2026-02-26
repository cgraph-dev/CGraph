/**
 * Holographic-themed button component with animated gradient effects and haptic feedback.
 * @module components/enhanced/ui/holographic-ui/HolographicButton
 */
import React, { ReactNode, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { HolographicConfig, getTheme } from '../types';

interface HolographicButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

/**
 *
 */
export function HolographicButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  colorTheme = 'cyan',
  style,
}: HolographicButtonProps) {
  const theme = getTheme(colorTheme);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: 16, paddingVertical: 8 },
    md: { paddingHorizontal: 24, paddingVertical: 12 },
    lg: { paddingHorizontal: 32, paddingVertical: 16 },
  };

  const textSizes: Record<string, number> = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          gradientColors: [`${theme.primary}20`, `${theme.secondary}30`] as const,
          borderColor: theme.primary,
          textColor: theme.primary,
        };
      case 'secondary':
        return {
          gradientColors: ['transparent', 'transparent'] as const,
          borderColor: theme.secondary,
          textColor: theme.secondary,
        };
      case 'danger':
        return {
          gradientColors: ['rgba(255,50,50,0.2)', 'rgba(255,100,100,0.3)'] as const,
          borderColor: 'rgba(255,100,100,0.8)',
          textColor: 'rgba(255,150,150,1)',
        };
      case 'ghost':
        return {
          gradientColors: ['transparent', 'transparent'] as const,
          borderColor: 'transparent',
          textColor: theme.primary,
        };
    }
  };

  const { gradientColors, borderColor, textColor } = getVariantColors();

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : 1,
        },
        Platform.OS === 'ios' && {
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity,
          shadowRadius: 15,
        },
        style,
      ]}
    >
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.buttonBase,
            sizeStyles[size],
            {
              borderColor,
              borderWidth: variant === 'ghost' ? 0 : variant === 'secondary' ? 1 : 2,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <Text
              style={[
                styles.buttonText,
                {
                  fontSize: textSizes[size],
                  color: textColor,
                  textShadowColor: theme.glow,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                },
              ]}
            >
              {children}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
