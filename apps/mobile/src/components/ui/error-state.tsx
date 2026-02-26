/**
 * Error state display component with animated icon, message, and retry action button.
 * @module components/ui/ErrorState
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ErrorType =
  | 'generic'
  | 'network'
  | 'notFound'
  | 'permission'
  | 'rateLimit'
  | 'server'
  | 'empty'
  | 'offline';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  showAnimation?: boolean;
  variant?: 'default' | 'minimal' | 'card';
}

/**
 * ErrorState - Premium animated error display component.
 *
 * Features:
 * - Multiple error types with predefined content
 * - Animated icon bounce/shake
 * - Gradient retry button with haptic feedback
 * - Floating particles in background
 * - Card and minimal variants
 */
export default function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  retryLabel,
  icon,
  style,
  showAnimation = true,
  variant = 'default',
}: ErrorStateProps) {
  // Animated values
  const iconBounce = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const iconShake = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Error type presets
  const errorPresets: Record<
    ErrorType,
    {
      title: string;
      message: string;
      icon: string;
      iconType: 'ionicon' | 'material';
      color: string;
    }
  > = {
    generic: {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again.',
      icon: 'alert-circle',
      iconType: 'ionicon',
      color: '#EF4444',
    },
    network: {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      icon: 'wifi-off',
      iconType: 'ionicon',
      color: '#F97316',
    },
    notFound: {
      title: 'Not Found',
      message: "The content you're looking for doesn't exist or has been removed.",
      icon: 'search-off',
      iconType: 'material',
      color: '#8B5CF6',
    },
    permission: {
      title: 'Access Denied',
      message: "You don't have permission to view this content.",
      icon: 'lock-closed',
      iconType: 'ionicon',
      color: '#EAB308',
    },
    rateLimit: {
      title: 'Too Many Requests',
      message: "You're making too many requests. Please wait a moment.",
      icon: 'time',
      iconType: 'ionicon',
      color: '#EC4899',
    },
    server: {
      title: 'Server Error',
      message: 'Our servers are having trouble. Please try again later.',
      icon: 'server',
      iconType: 'ionicon',
      color: '#EF4444',
    },
    empty: {
      title: 'Nothing Here',
      message: 'No content to display yet.',
      icon: 'document-text-outline',
      iconType: 'ionicon',
      color: '#6B7280',
    },
    offline: {
      title: "You're Offline",
      message: 'Please connect to the internet to continue.',
      icon: 'cloud-offline',
      iconType: 'ionicon',
      color: '#64748B',
    },
  };

  const preset = errorPresets[type];
  const displayTitle = title || preset.title;
  const displayMessage = message || preset.message;
  const displayRetryLabel = retryLabel || 'Try Again';

  useEffect(() => {
    if (showAnimation) {
      // Fade in and slide up
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Icon bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconBounce, {
            toValue: -8,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(iconBounce, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Subtle shake for error types
      if (type === 'generic' || type === 'server' || type === 'permission') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(iconShake, {
              toValue: 3,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(iconShake, {
              toValue: -3,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(iconShake, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.delay(3000),
          ])
        ).start();
      }
    } else {
      fadeIn.setValue(1);
      slideUp.setValue(0);
    }
  }, [showAnimation, type]);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onRetry?.();
  };

  const renderIcon = () => {
    if (icon) {
      return icon;
    }

    const iconSize = variant === 'minimal' ? 40 : 48;
    const IconComponent = preset.iconType === 'ionicon' ? Ionicons : MaterialIcons;

    return (
      <Animated.View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${preset.color}15`,
            transform: [{ translateY: iconBounce }, { translateX: iconShake }],
          },
          variant === 'minimal' && styles.iconContainerMinimal,
        ]}
      >
        { }
        <IconComponent name={preset.icon as string} size={iconSize} color={preset.color} />
      </Animated.View>
    );
  };

  const content = (
    <Animated.View
      style={[
        styles.container,
        variant === 'minimal' && styles.containerMinimal,
        variant === 'card' && styles.containerCard,
        {
          opacity: fadeIn,
          transform: [{ translateY: slideUp }],
        },
        style,
      ]}
    >
      {renderIcon()}

      <Text style={[styles.title, variant === 'minimal' && styles.titleMinimal]}>
        {displayTitle}
      </Text>

      <Text style={[styles.message, variant === 'minimal' && styles.messageMinimal]}>
        {displayMessage}
      </Text>

      {onRetry && (
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity onPress={handleRetry} activeOpacity={0.8} style={styles.buttonWrapper}>
            <LinearGradient
              colors={[preset.color, adjustColor(preset.color, -20)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.retryButton, variant === 'minimal' && styles.retryButtonMinimal]}
            >
              <Ionicons name="refresh" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryText}>{displayRetryLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );

  if (variant === 'card') {
    return (
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={['rgba(31, 41, 55, 0.8)', 'rgba(17, 24, 39, 0.9)']}
          style={styles.cardGradient}
        >
          {content}
        </LinearGradient>
      </View>
    );
  }

  return content;
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Pre-built error variants
/**
 *
 */
export function NetworkError({ onRetry, style }: { onRetry?: () => void; style?: ViewStyle }) {
  return <ErrorState type="network" onRetry={onRetry} style={style} />;
}

/**
 *
 */
export function NotFoundError({ type = 'Content', style }: { type?: string; style?: ViewStyle }) {
  return (
    <ErrorState
      type="notFound"
      title={`${type} Not Found`}
      message={`The ${type.toLowerCase()} you're looking for doesn't exist or has been removed.`}
      style={style}
    />
  );
}

/**
 *
 */
export function PermissionError({ style }: { style?: ViewStyle }) {
  return <ErrorState type="permission" style={style} />;
}

/**
 *
 */
export function RateLimitError({ onRetry, style }: { onRetry?: () => void; style?: ViewStyle }) {
  return (
    <ErrorState type="rateLimit" onRetry={onRetry} retryLabel="Try Again Later" style={style} />
  );
}

/**
 *
 */
export function ServerError({ onRetry, style }: { onRetry?: () => void; style?: ViewStyle }) {
  return <ErrorState type="server" onRetry={onRetry} style={style} />;
}

/**
 *
 */
export function EmptyState({
  title = 'Nothing Here',
  message = 'No content to display yet.',
  icon,
  onRetry,
  retryLabel,
  style,
}: {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}) {
  return (
    <ErrorState
      type="empty"
      title={title}
      message={message}
      icon={icon}
      onRetry={onRetry}
      retryLabel={retryLabel}
      style={style}
    />
  );
}

/**
 *
 */
export function OfflineError({ onRetry, style }: { onRetry?: () => void; style?: ViewStyle }) {
  return <ErrorState type="offline" onRetry={onRetry} style={style} />;
}

// Card variant shortcuts
/**
 *
 */
export function NetworkErrorCard({ onRetry, style }: { onRetry?: () => void; style?: ViewStyle }) {
  return <ErrorState type="network" onRetry={onRetry} variant="card" style={style} />;
}

/**
 *
 */
export function ServerErrorCard({ onRetry, style }: { onRetry?: () => void; style?: ViewStyle }) {
  return <ErrorState type="server" onRetry={onRetry} variant="card" style={style} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  containerMinimal: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  containerCard: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  cardWrapper: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    borderRadius: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconContainerMinimal: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3F4F6',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  titleMinimal: {
    fontSize: 17,
  },
  message: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH * 0.8,
    marginBottom: 24,
    lineHeight: 22,
  },
  messageMinimal: {
    fontSize: 14,
    marginBottom: 16,
  },
  buttonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  retryButtonMinimal: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
