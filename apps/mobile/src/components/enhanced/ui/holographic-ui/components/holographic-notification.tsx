import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, Platform, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, withTiming, withSpring, withRepeat, withSequence, useAnimatedStyle, interpolate, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { HolographicConfig, getTheme, HOLOGRAPHIC_THEMES } from '../types';
import { HolographicText } from './holographic-text';
import { Scanlines } from './decorations';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface HolographicNotificationProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: NotificationType;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

const TYPE_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'warning-outline',
  error: 'alert-circle-outline',
};

const TYPE_THEMES: Record<NotificationType, HolographicConfig['colorTheme']> = {
  info: 'cyan',
  success: 'green',
  warning: 'gold',
  error: 'purple', // Could add 'red' theme if needed
};

export function HolographicNotification({
  visible,
  title,
  message,
  type = 'info',
  onDismiss,
  autoHide = true,
  duration = 3000,
  colorTheme,
  style,
}: HolographicNotificationProps) {
  // Use type-based theme if no colorTheme specified
  const actualTheme = colorTheme || TYPE_THEMES[type];
  const theme = getTheme(actualTheme);

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'error'
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning
      );

      translateY.value = withSpring(0, { stiffness: 100, damping: 10 });
      opacity.value = withTiming(1, { duration: 200 });

      // Glow pulse animation
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1
      );

      // Auto-hide logic
      if (autoHide && onDismiss) {
        const timeout = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => {
          clearTimeout(timeout);
        };
      }
    } else {
      translateY.value = -100;
      opacity.value = 0;
    }
  }, [visible, autoHide, duration]);

  const handleDismiss = () => {
    translateY.value = withTiming(-100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished && onDismiss) {
        runOnJS(onDismiss)();
      }
    });
  };

  if (!visible) return null;

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    ...(Platform.OS === 'ios' ? {
      shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.4, 0.8]),
    } : {}),
  }));

  const borderGlowAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.5, 1]),
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        Platform.OS === 'ios' && {
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 15,
        },
        containerAnimStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={[theme.background, `${theme.background}E6`]}
        style={[StyleSheet.absoluteFill, styles.gradientBg]}
      />

      <Scanlines colorTheme={actualTheme} intensity="low" animated={false} />

      {/* Border glow */}
      <Animated.View
        style={[
          styles.borderGlow,
          {
            borderColor: theme.primary,
          },
          borderGlowAnimStyle,
        ]}
      />

      <TouchableOpacity onPress={handleDismiss} style={styles.contentWrapper} activeOpacity={0.9}>
        <Ionicons name={TYPE_ICONS[type]} size={24} color={theme.primary} style={styles.icon} />

        <Animated.View style={styles.textContent}>
          <HolographicText variant="subtitle" colorTheme={actualTheme} style={styles.title}>
            {title}
          </HolographicText>
          {message && (
            <HolographicText variant="body" colorTheme={actualTheme} style={styles.message}>
              {message}
            </HolographicText>
          )}
        </Animated.View>

        <Ionicons name="close" size={20} color={`${theme.secondary}80`} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 10,
  },
  gradientBg: {
    borderRadius: 12,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
  message: {
    opacity: 0.8,
  },
});
