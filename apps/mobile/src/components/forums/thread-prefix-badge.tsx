/**
 * ThreadPrefixBadge Component (React Native)
 * Displays colored prefix badges on thread titles (e.g., [SOLVED], [HELP], [BUG])
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ThreadPrefix } from '@/types';

interface ThreadPrefixBadgeProps {
  prefix: ThreadPrefix | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

/**
 *
 */
export default function ThreadPrefixBadge({
  prefix,
  size = 'md',
  onPress
}: ThreadPrefixBadgeProps) {
  if (!prefix) return null;

  const sizeStyles = {
    sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 11 },
    md: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
    lg: { paddingHorizontal: 10, paddingVertical: 6, fontSize: 14 },
  };

  const currentSize = sizeStyles[size];

  // Parse color (ensure it's a valid hex)
  const backgroundColor = prefix.color.startsWith('#')
    ? prefix.color + '33' // Add 20% opacity
    : `#${prefix.color}33`;

  const borderColor = prefix.color.startsWith('#')
    ? prefix.color + '66' // Add 40% opacity
    : `#${prefix.color}66`;

  const textColor = prefix.color.startsWith('#')
    ? prefix.color
    : `#${prefix.color}`;

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {prefix.name}
      </Text>
    </Component>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
