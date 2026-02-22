import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, ViewStyle, Platform, TouchableOpacity } from 'react-native';
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

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'error'
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning
      );

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow pulse animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowPulse, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      pulseLoop.start();

      // Auto-hide logic
      if (autoHide && onDismiss) {
        const timeout = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => {
          clearTimeout(timeout);
          pulseLoop.stop();
        };
      }

      return () => {
        pulseLoop.stop();
      };
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible, autoHide, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const shadowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
        Platform.OS === 'ios' && {
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity,
          shadowRadius: 15,
        },
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
            opacity: glowPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          },
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
