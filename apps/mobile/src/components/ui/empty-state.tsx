/**
 * Mobile Empty State
 *
 * Animated empty-state component for React Native screens.
 * Uses Reanimated FadeIn entering animation and shared
 * animation tokens from @cgraph/animation-constants.
 *
 * @module components/ui/EmptyState
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { rnTransitions } from '@cgraph/animation-constants';

interface EmptyStateProps {
  /** Ionicon name for the illustration */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Custom icon/illustration element */
  iconComponent?: React.ReactNode;
  /** Main heading */
  title: string;
  /** Supporting description */
  description?: string;
  /** CTA button label */
  actionLabel?: string;
  /** CTA button handler */
  onAction?: () => void;
  /** Container style overrides */
  style?: ViewStyle;
}

/**
 * Animated empty state with fade-in entrance.
 *
 * Renders an icon, title, optional description, and an action button.
 * Uses `FadeIn` entering animation from react-native-reanimated
 * with timing sourced from animation-constants.
 */
export function EmptyState({
  icon = 'file-tray-outline',
  iconComponent,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps): React.ReactElement {
  return (
    <Animated.View
      entering={FadeIn.duration(rnTransitions.fadeIn.duration)}
      style={[styles.container, style]}
    >
      {/* Icon / illustration */}
      <Animated.View entering={FadeInDown.duration(rnTransitions.pageEnter.duration).delay(80)}>
        {iconComponent ?? <Ionicons name={icon} size={64} color="#6b7280" style={styles.icon} />}
      </Animated.View>

      {/* Title */}
      <Animated.Text
        entering={FadeInDown.duration(rnTransitions.pageEnter.duration).delay(140)}
        style={styles.title}
      >
        {title}
      </Animated.Text>

      {/* Description */}
      {description ? (
        <Animated.Text
          entering={FadeInDown.duration(rnTransitions.pageEnter.duration).delay(200)}
          style={styles.description}
        >
          {description}
        </Animated.Text>
      ) : null}

      {/* Action button */}
      {actionLabel && onAction ? (
        <Animated.View entering={FadeInDown.duration(rnTransitions.pageEnter.duration).delay(260)}>
          <TouchableOpacity onPress={onAction} style={styles.button} activeOpacity={0.7}>
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
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
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmptyState;
