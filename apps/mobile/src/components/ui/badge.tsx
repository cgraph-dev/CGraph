/**
 * Badge component with multiple variants, sizes, animated entrance, and gradient styling options.
 * @module components/ui/Badge
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming, Easing as ReanimatedEasing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'premium'
  | 'legendary'
  | 'rare'
  | 'epic';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
  icon?: React.ReactNode;
  animated?: boolean;
  pulse?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

/**
 * Badge - A premium animated status indicator component.
 *
 * Features:
 * - Multiple variants (default, primary, success, warning, danger, info, premium, legendary, rare, epic)
 * - Animated entrance
 * - Pulsing animation for attention
 * - Glowing effects for premium badges
 * - Gradient backgrounds
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
  dot = false,
  icon,
  animated = true,
  pulse = false,
  glow = false,
  gradient = false,
}: BadgeProps) {
  // Animated values
  const scaleAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.3);

  useEffect(() => {
    // Entrance animation
    if (animated) {
      scaleAnim.value = withSpring(1, { stiffness: 100, damping: 8 });
    } else {
      scaleAnim.value = 1;
    }

    // Pulse animation
    if (pulse) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) }),
          withTiming(1, { duration: 800, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) })
        ),
        -1
      );
    }

    // Glow animation
    if (glow) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) }),
          withTiming(0.3, { duration: 1500, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) })
        ),
        -1
      );
    }
  }, [animated, pulse, glow]);

  const variantStyles: Record<
    BadgeVariant,
    { bg: string; text: string; border: string; gradient?: string[] }
  > = {
    default: { bg: '#374151', text: '#D1D5DB', border: '#4B5563' },
    primary: { bg: 'rgba(139, 92, 246, 0.2)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.3)' },
    success: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
    warning: { bg: 'rgba(234, 179, 8, 0.2)', text: '#FACC15', border: 'rgba(234, 179, 8, 0.3)' },
    danger: { bg: 'rgba(239, 68, 68, 0.2)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
    info: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
    premium: {
      bg: 'rgba(251, 191, 36, 0.2)',
      text: '#FCD34D',
      border: 'rgba(251, 191, 36, 0.5)',
      gradient: ['#F59E0B', '#EAB308', '#F59E0B'],
    },
    legendary: {
      bg: 'rgba(251, 146, 60, 0.2)',
      text: '#FB923C',
      border: 'rgba(251, 146, 60, 0.5)',
      gradient: ['#EA580C', '#F97316', '#FB923C'],
    },
    rare: {
      bg: 'rgba(6, 182, 212, 0.2)',
      text: '#22D3EE',
      border: 'rgba(6, 182, 212, 0.5)',
      gradient: ['#0891B2', '#06B6D4', '#22D3EE'],
    },
    epic: {
      bg: 'rgba(168, 85, 247, 0.2)',
      text: '#C084FC',
      border: 'rgba(168, 85, 247, 0.5)',
      gradient: ['#7C3AED', '#8B5CF6', '#A855F7'],
    },
  };

  const sizeStyles: Record<
    BadgeSize,
    { paddingH: number; paddingV: number; fontSize: number; dotSize: number }
  > = {
    xs: { paddingH: 6, paddingV: 2, fontSize: 10, dotSize: 4 },
    sm: { paddingH: 8, paddingV: 3, fontSize: 11, dotSize: 5 },
    md: { paddingH: 10, paddingV: 4, fontSize: 12, dotSize: 6 },
    lg: { paddingH: 12, paddingV: 6, fontSize: 14, dotSize: 7 },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  const badgeContent = (
    <>
      {dot && (
        <View
          style={[
            styles.dot,
            {
              width: currentSize.dotSize,
              height: currentSize.dotSize,
              backgroundColor: currentVariant.text,
            },
          ]}
        />
      )}
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            fontSize: currentSize.fontSize,
            color: currentVariant.text,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </>
  );

  const containerStyle: ViewStyle = {
    paddingHorizontal: currentSize.paddingH,
    paddingVertical: currentSize.paddingV,
    backgroundColor: !gradient ? currentVariant.bg : 'transparent',
    borderColor: currentVariant.border,
    borderWidth: 1,
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value * pulseAnim.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        style,
        animatedContainerStyle,
        glow && {
          shadowColor: currentVariant.text,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 8,
        },
      ]}
    >
      {gradient && currentVariant.gradient ? (
        <LinearGradient
          colors={currentVariant.gradient as unknown}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: 100 }]}
        >
          <View
            style={[
              styles.innerContainer,
              { paddingHorizontal: currentSize.paddingH, paddingVertical: currentSize.paddingV },
            ]}
          >
            {badgeContent}
          </View>
        </LinearGradient>
      ) : (
        badgeContent
      )}
    </Animated.View>
  );
}

// Predefined badge variants for common use cases
export function NewBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="success" size="sm" style={style} pulse>
      ✨ New
    </Badge>
  );
}

export function HotBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="danger" size="sm" style={style} pulse glow>
      🔥 Hot
    </Badge>
  );
}

export function NsfwBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="danger" size="sm" style={style}>
      NSFW
    </Badge>
  );
}

export function PinnedBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="success" size="sm" style={style}>
      📌 Pinned
    </Badge>
  );
}

export function PrivateBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="warning" size="sm" style={style}>
      🔒 Private
    </Badge>
  );
}

export function PublicBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="info" size="sm" style={style}>
      🌐 Public
    </Badge>
  );
}

export function OwnerBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="premium" size="sm" style={style} glow gradient>
      👑 Owner
    </Badge>
  );
}

export function ModeratorBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="success" size="sm" style={style}>
      🛡️ Mod
    </Badge>
  );
}

export function MemberBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="default" size="sm" style={style}>
      Member
    </Badge>
  );
}

export function PremiumBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="premium" size="sm" style={style} glow gradient>
      ⭐ Premium
    </Badge>
  );
}

export function LegendaryBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="legendary" size="sm" style={style} glow pulse gradient>
      🏆 Legendary
    </Badge>
  );
}

export function RareBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="rare" size="sm" style={style} glow>
      💎 Rare
    </Badge>
  );
}

export function EpicBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="epic" size="sm" style={style} glow>
      ⚡ Epic
    </Badge>
  );
}

export function OnlineBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="success" size="xs" style={style} dot animated={false}>
      Online
    </Badge>
  );
}

export function OfflineBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="default" size="xs" style={style} dot animated={false}>
      Offline
    </Badge>
  );
}

export function AwayBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="warning" size="xs" style={style} dot animated={false}>
      Away
    </Badge>
  );
}

export function BusyBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="danger" size="xs" style={style} dot animated={false}>
      Busy
    </Badge>
  );
}

export function VerifiedBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="info" size="sm" style={style} glow>
      ✓ Verified
    </Badge>
  );
}

export function AdminBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="danger" size="sm" style={style} glow>
      🛡️ Admin
    </Badge>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 100,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 100,
    marginRight: 6,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
