/**
 * GlassCard Component - Next-Gen Glassmorphism for React Native
 * 5 premium variants with blur effects, gradients, and animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AnimationColors } from '@/lib/animations/AnimationEngine';

type GlassVariant = 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic';
type GlassIntensity = 'subtle' | 'medium' | 'strong';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  intensity?: GlassIntensity;
  animated?: boolean;
  glowColor?: string;
  style?: ViewStyle;
}

export default function GlassCard({
  children,
  variant = 'default',
  intensity = 'medium',
  animated = false,
  glowColor = AnimationColors.primary,
  style,
}: GlassCardProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      // Shimmer animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation (subtle)
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const getBlurIntensity = (): number => {
    const intensityMap = {
      subtle: 10,
      medium: 20,
      strong: 40,
    };
    return intensityMap[intensity];
  };

  const getBackgroundOpacity = (): number => {
    const opacityMap = {
      subtle: 0.1,
      medium: 0.2,
      strong: 0.3,
    };
    return opacityMap[intensity];
  };

  const getBorderGradient = (): string[] => {
    switch (variant) {
      case 'frosted':
        return ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)'];
      case 'crystal':
        return ['rgba(16, 185, 129, 0.3)', 'rgba(139, 92, 246, 0.3)'];
      case 'neon':
        return [AnimationColors.neonCyan, AnimationColors.neonMagenta];
      case 'holographic':
        return [
          AnimationColors.primary,
          AnimationColors.purple,
          AnimationColors.pink,
          AnimationColors.amber,
        ];
      default:
        return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
    }
  };

  const getGlowStyle = (): ViewStyle => {
    if (variant === 'neon' || variant === 'holographic') {
      return {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 8,
      };
    }
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    };
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        getGlowStyle(),
        style,
        animated && { transform: [{ scale: pulseAnim }] },
      ]}
    >
      {/* Background blur layer */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={getBlurIntensity()}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        // Android fallback (no blur)
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: `rgba(31, 41, 55, ${getBackgroundOpacity()})`,
            },
          ]}
        />
      )}

      {/* Background color overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: AnimationColors.dark800,
            opacity: getBackgroundOpacity(),
          },
        ]}
      />

      {/* Border gradient */}
      <LinearGradient
        colors={getBorderGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderGradient}
      />

      {/* Shimmer effect (animated) */}
      {animated && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0)',
              'rgba(255, 255, 255, 0.1)',
              'rgba(255, 255, 255, 0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Holographic scanlines (variant-specific) */}
      {variant === 'holographic' && (
        <View style={styles.scanlines} pointerEvents="none">
          {[...Array(10)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.scanline,
                { top: `${i * 10}%` },
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  borderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    padding: 1,
  },
  content: {
    borderRadius: 15,
    overflow: 'hidden',
    zIndex: 1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 300,
    zIndex: 2,
    pointerEvents: 'none',
  },
  scanlines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
  },
});
