/**
 * Enhanced Avatar for mobile — matches web Avatar API.
 * Supports status rings, story rings, typing indicator.
 * @module components/ui/avatar
 */
import React, { useMemo } from 'react';
import { View, Image, Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { space } from '@/theme/tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type AvatarStatus = 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  storyRing?: boolean;
  typing?: boolean;
  variant?: 'circle' | 'square';
  style?: ViewStyle;
}

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
  '2xl': 80,
  '3xl': 120,
};

const STATUS_COLORS: Record<AvatarStatus, string> = {
  online: '#22c55e',
  offline: '#6b7280',
  idle: '#eab308',
  dnd: '#ef4444',
  invisible: '#6b7280',
};

const GRADIENTS = [
  ['#ef4444', '#f97316'],
  ['#f97316', '#f59e0b'],
  ['#22c55e', '#10b981'],
  ['#06b6d4', '#3b82f6'],
  ['#3b82f6', '#6366f1'],
  ['#8b5cf6', '#a855f7'],
  ['#a855f7', '#ec4899'],
  ['#ec4899', '#f43f5e'],
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.charAt(0).toUpperCase();
}

function TypingDots({ dotSize }: { dotSize: number }) {
  return (
    <View style={styles.typingContainer}>
      {[0, 1, 2].map((i) => (
        <TypingDot key={i} size={dotSize} delay={i * 150} />
      ))}
    </View>
  );
}

function TypingDot({ size, delay: delayMs }: { size: number; delay: number }) {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withDelay(
        delayMs,
        withSequence(
          withTiming(-3, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
      ),
      -1,
      false,
    );
  }, [delayMs, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#ffffff',
        },
        animStyle,
      ]}
    />
  );
}

export default function Avatar({
  src,
  name = '',
  size = 'md',
  status,
  storyRing = false,
  typing = false,
  variant = 'circle',
  style,
}: AvatarProps) {
  const px = SIZE_PX[size];
  const borderRadius = variant === 'square' ? px * 0.15 : px / 2;
  const gradient = useMemo(() => GRADIENTS[hashName(name) % GRADIENTS.length]!, [name]);
  const statusDotSize = Math.max(px * 0.25, 6);
  const dotSize = Math.max(px * 0.08, 2);

  return (
    <View style={[{ width: px, height: px, position: 'relative' }, style]}>
      {/* Story ring wrapper */}
      {storyRing && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: borderRadius + 3,
              borderWidth: 2,
              borderColor: '#a855f7',
              margin: -3,
            },
          ]}
        />
      )}

      {/* Avatar image/initials */}
      <View
        style={{
          width: px,
          height: px,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: src ? '#1e2028' : gradient[0],
        }}
      >
        {src ? (
          <Image
            source={{ uri: src }}
            style={{ width: px, height: px }}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.initialsBox, { backgroundColor: gradient[0] }]}>
            <Text
              style={[
                styles.initials,
                { fontSize: px * 0.38 },
              ]}
            >
              {getInitials(name)}
            </Text>
          </View>
        )}

        {/* Typing overlay */}
        {typing && (
          <View style={[StyleSheet.absoluteFillObject, styles.typingOverlay]}>
            <TypingDots dotSize={dotSize} />
          </View>
        )}
      </View>

      {/* Status dot */}
      {status && status !== 'invisible' && (
        <View
          style={[
            styles.statusDot,
            {
              width: statusDotSize,
              height: statusDotSize,
              borderRadius: statusDotSize / 2,
              backgroundColor: STATUS_COLORS[status],
              borderWidth: 2,
              borderColor: '#0f0f14',
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  initialsBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
  },
  typingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
