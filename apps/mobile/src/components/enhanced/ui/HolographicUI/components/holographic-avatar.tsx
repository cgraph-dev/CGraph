import React, { useRef, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet, ViewStyle, Platform, Easing } from 'react-native';
import { HolographicConfig, getTheme } from '../types';

interface HolographicAvatarProps {
  source?: { uri: string } | number;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

export function HolographicAvatar({
  source,
  name,
  size = 'md',
  status,
  colorTheme = 'cyan',
  style,
}: HolographicAvatarProps) {
  const theme = getTheme(colorTheme);
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;
  const statusPulse = useRef(new Animated.Value(1)).current;

  const sizeValues = {
    sm: { container: 32, text: 10, status: 8 },
    md: { container: 48, text: 14, status: 12 },
    lg: { container: 64, text: 18, status: 14 },
    xl: { container: 96, text: 28, status: 18 },
  };

  const statusColors = {
    online: 'rgb(50, 255, 100)',
    offline: 'rgb(150, 150, 150)',
    away: 'rgb(255, 200, 50)',
    busy: 'rgb(255, 80, 80)',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Ring animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.2,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  // Status pulse
  useEffect(() => {
    if (!status) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(statusPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [status]);

  const currentSize = sizeValues[size];

  return (
    <View style={[{ width: currentSize.container, height: currentSize.container }, style]}>
      {/* Animated ring */}
      <Animated.View
        style={[
          styles.avatarRing,
          {
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: currentSize.container / 2,
            borderColor: theme.accent,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />

      {/* Avatar container */}
      <View
        style={[
          styles.avatarContainer,
          {
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: currentSize.container / 2,
            borderColor: theme.primary,
            backgroundColor: theme.background,
          },
          Platform.OS === 'ios' && {
            shadowColor: theme.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 10,
          },
        ]}
      >
        {source ? (
          <Image
            source={source}
            style={[
              styles.avatarImage,
              {
                width: currentSize.container - 4,
                height: currentSize.container - 4,
                borderRadius: (currentSize.container - 4) / 2,
              },
            ]}
          />
        ) : (
          <Text
            style={[
              styles.avatarInitials,
              {
                fontSize: currentSize.text,
                color: theme.primary,
              },
            ]}
          >
            {initials}
          </Text>
        )}
      </View>

      {/* Status indicator */}
      {status && (
        <Animated.View
          style={[
            styles.statusIndicator,
            {
              width: currentSize.status,
              height: currentSize.status,
              borderRadius: currentSize.status / 2,
              backgroundColor: statusColors[status],
              borderColor: theme.background,
              transform: [{ scale: statusPulse }],
            },
            Platform.OS === 'ios' && {
              shadowColor: statusColors[status],
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarInitials: {
    fontWeight: '700',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});
