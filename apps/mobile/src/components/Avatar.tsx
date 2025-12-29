import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface AvatarProps {
  /** Image URL or null for initials */
  source?: string | null;
  /** Name to generate initials from */
  name?: string;
  /** Size in pixels */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** User status indicator */
  status?: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';
  /** Show status indicator */
  showStatus?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const STATUS_COLORS = {
  online: '#22c55e',
  idle: '#eab308',
  dnd: '#ef4444',
  offline: '#6b7280',
  invisible: '#6b7280',
};

export default function Avatar({
  source,
  name,
  size = 'md',
  status,
  showStatus = true,
  style,
}: AvatarProps) {
  const { colors } = useTheme();
  const sizeValue = typeof size === 'number' ? size : SIZES[size];
  const fontSize = sizeValue * 0.4;
  const statusSize = Math.max(sizeValue * 0.25, 8);

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Generate consistent color from name
  const getColorFromName = (name: string) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e', '#ef4444', '#f97316',
      '#f59e0b', '#eab308', '#84cc16', '#22c55e',
      '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length] || colors[0];
  };

  return (
    <View style={[styles.container, { width: sizeValue, height: sizeValue }, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
              backgroundColor: name ? getColorFromName(name) : colors.primary,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
      {showStatus && status && (
        <View
          style={[
            styles.statusBadge,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              backgroundColor: STATUS_COLORS[status],
              borderColor: colors.surface,
              borderWidth: 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
