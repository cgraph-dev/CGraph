import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  /** User status */
  status: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';
  /** Size in pixels */
  size?: number;
  /** Border color (for ring effect) */
  borderColor?: string;
}

const STATUS_COLORS = {
  online: '#22c55e',
  idle: '#eab308',
  dnd: '#ef4444',
  offline: '#6b7280',
  invisible: '#6b7280',
};

export default function StatusBadge({
  status,
  size = 12,
  borderColor = '#1f2937',
}: StatusBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: STATUS_COLORS[status],
          borderColor,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
  },
});
