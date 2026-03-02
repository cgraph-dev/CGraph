/**
 * Mobile Error Fallback
 *
 * Friendly error screen for React Native with retry action.
 * Uses Reanimated FadeIn + shared animation tokens.
 *
 * @module components/ui/ErrorFallback
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { rnTransitions } from '@cgraph/animation-constants';

interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error;
  /** Callback to retry / reset the error boundary */
  retry: () => void;
  /** Optional title override */
  title?: string;
  /** Container style overrides */
  style?: ViewStyle;
}

/**
 * Renders a user-friendly error screen with a retry button.
 *
 * Intended to be used as the fallback component inside an
 * error boundary wrapper or a query-error handler.
 */
export function ErrorFallback({
  error,
  retry,
  title = 'Something went wrong',
  style,
}: ErrorFallbackProps): React.ReactElement {
  return (
    <Animated.View
      entering={FadeIn.duration(rnTransitions.fadeIn.duration)}
      style={[styles.container, style]}
    >
      {/* Icon */}
      <Animated.View entering={FadeInDown.duration(rnTransitions.pageEnter.duration).delay(60)}>
        <View style={styles.iconCircle}>
          <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={FadeInDown.duration(rnTransitions.pageEnter.duration).delay(120)}
        style={styles.title}
      >
        {title}
      </Animated.Text>

      {/* Error message */}
      <Animated.Text
        entering={FadeInDown.duration(rnTransitions.pageEnter.duration).delay(180)}
        style={styles.message}
        numberOfLines={3}
      >
        {error.message || 'An unexpected error occurred. Please try again.'}
      </Animated.Text>

      {/* Retry button */}
      <Animated.View entering={FadeInDown.duration(rnTransitions.pageEnter.duration).delay(240)}>
        <TouchableOpacity onPress={retry} style={styles.retryButton} activeOpacity={0.7}>
          <Ionicons name="refresh" size={18} color="#ffffff" style={styles.retryIcon} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorFallback;
