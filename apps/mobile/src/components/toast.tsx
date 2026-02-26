/**
 * Animated toast notification component with type-based styling and auto-dismiss behavior.
 * @module components/Toast
 */
import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: ToastType;
  /** Duration in ms */
  duration?: number;
  /** Visible state */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Additional styles */
  style?: ViewStyle;
}

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

const COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

/**
 *
 */
export default function Toast({
  message,
  type = 'info',
  duration = 3000,
  visible,
  onClose,
  style,
}: ToastProps) {
  const { colors } = useThemeStore();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      return undefined;
    }
  }, [visible, duration, onClose, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderLeftColor: COLORS[type],
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${type}: ${message}`}
    >
      <Ionicons name={ICONS[type]} size={24} color={COLORS[type]} />
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
      >
        <Ionicons name="close" size={20} color={colors.textSecondary} />
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 14,
  },
});
