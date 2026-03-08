/**
 * Avatar component that displays a user's profile image or generated initials with configurable size and online status.
 * @module components/Avatar
 */
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '@/stores';
import AnimatedBorder, { type BorderAnimationType } from './gamification/animated-border';
import LottieAvatar from './lottie-avatar';

/** Equipped border data from the gamification system. */
export interface EquippedBorderData {
  id: string;
  animationType?: string;
  animation_type?: string;
  primaryColor?: string;
  primary_color?: string;
  secondaryColor?: string;
  secondary_color?: string;
  accentColor?: string;
  accent_color?: string;
}

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
  /** Avatar shape — circle (default) or square */
  shape?: 'circle' | 'square';
  /** URL to a Lottie JSON animation (renders inside avatar bounds) */
  lottieUrl?: string;
  /** Gamification equipped border */
  equippedBorder?: EquippedBorderData | null;
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

const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
];

/**
 * Generate consistent color from name using hash.
 */
function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

/**
 * Avatar component displaying a user image or generated initials.
 */
export default function Avatar({
  source,
  name,
  size = 'md',
  status,
  showStatus = true,
  shape = 'circle',
  lottieUrl,
  equippedBorder,
  style,
}: AvatarProps) {
  const { colors } = useThemeStore();
  const sizeValue = typeof size === 'number' ? size : SIZES[size];
  const fontSize = sizeValue * 0.4;
  const statusSize = Math.max(sizeValue * 0.25, 8);

  // Compute border radius based on shape
  const borderRadius = shape === 'square' ? 16 : sizeValue / 2;

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Filter out invalid URL schemes that can't be loaded directly
  // ph:// is iOS Photos library, assets-library:// is legacy iOS
  const validSource =
    source && !source.startsWith('ph://') && !source.startsWith('assets-library://')
      ? source
      : null;

  // Lottie animated avatar
  if (lottieUrl) {
    return (
      <LottieAvatar
        lottieUrl={lottieUrl}
        size={sizeValue}
        fallbackSource={validSource}
        initials={initials}
        initialsColor={name ? getColorFromName(name) : colors.primary}
      />
    );
  }

  // Resolve equipped border animation type
  const rawType = equippedBorder?.animationType ?? equippedBorder?.animation_type ?? 'none';
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- dynamic border type from API
  const borderAnimationType = rawType as BorderAnimationType;
  const hasBorder = equippedBorder != null && borderAnimationType !== 'none';

  const avatarContent = (
    <View
      style={[
        styles.container,
        { width: sizeValue, height: sizeValue },
        !hasBorder ? style : undefined,
      ]}
      accessible={true}
      accessibilityLabel={name ? `${name} avatar` : 'User avatar'}
      accessibilityRole="image"
    >
      {validSource ? (
        <Image
          source={{ uri: validSource }}
          style={[
            styles.image,
            {
              width: sizeValue,
              height: sizeValue,
              borderRadius,
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
              borderRadius,
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

  if (hasBorder) {
    return (
      <AnimatedBorder
        animationType={borderAnimationType}
        borderColor={equippedBorder?.primaryColor ?? equippedBorder?.primary_color}
        borderColorSecondary={equippedBorder?.secondaryColor ?? equippedBorder?.secondary_color}
        borderColorAccent={equippedBorder?.accentColor ?? equippedBorder?.accent_color}
        size={sizeValue + 6}
        borderWidth={3}
      >
        {avatarContent}
      </AnimatedBorder>
    );
  }

  return avatarContent;
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
