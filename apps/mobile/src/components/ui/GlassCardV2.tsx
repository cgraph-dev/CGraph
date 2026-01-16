/**
 * GlassCard V2 - Next-Generation Glassmorphism Component
 *
 * Features:
 * - 10 glassmorphism variants
 * - 3D depth effects with layered shadows
 * - Animated borders with 5 animation modes
 * - Shimmer effects with customizable speed/direction
 * - Inner glow highlights on interaction
 * - Particle overlay support
 * - Press state animations (scale, glow, shadow)
 * - Long-press reveal animations
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import BlurViewCross from '@/lib/effects/BlurViewCross';
import { BlurStyle, BlurIntensity } from '@/lib/effects/BlurEngine';
import ParticleView from '@/lib/effects/ParticleView';
import { ParticleType } from '@/lib/effects/ParticleSystem';

// ============================================================================
// Types
// ============================================================================

export type GlassVariant =
  | 'default'
  | 'frosted'
  | 'crystal'
  | 'neon'
  | 'holographic'
  | 'aurora'
  | 'midnight'
  | 'dawn'
  | 'ember'
  | 'ocean';

export type BorderAnimationMode = 'none' | 'rotate' | 'pulse' | 'shimmer' | 'wave' | 'breathe';

export type PressAnimation = 'none' | 'scale' | 'glow' | 'shadow' | 'all';

export interface GlassCardV2Props {
  children: React.ReactNode;
  variant?: GlassVariant;
  intensity?: BlurIntensity;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;

  // Border options
  borderGradient?: boolean;
  borderWidth?: number;
  borderColors?: string[];
  borderAnimation?: BorderAnimationMode;
  borderAnimationDuration?: number;

  // Animation options
  animated?: boolean;
  shimmerSpeed?: number;
  shimmerDirection?: 'left' | 'right' | 'up' | 'down';

  // 3D depth
  depth?: 'flat' | 'shallow' | 'medium' | 'deep';
  shadowColor?: string;

  // Glow options
  innerGlow?: boolean;
  outerGlow?: boolean;
  glowColor?: string;
  glowIntensity?: number;

  // Particle overlay
  particles?: boolean;
  particleType?: ParticleType;
  particleCount?: number;
  particleColors?: string[];

  // Scanlines
  scanlines?: boolean;
  scanlineOpacity?: number;
  scanlineSpeed?: number;

  // Interaction
  pressable?: boolean;
  pressAnimation?: PressAnimation;
  onPress?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: boolean;

  // Accessibility
  testID?: string;
  accessibilityLabel?: string;
}

// ============================================================================
// Variant Configurations
// ============================================================================

interface VariantConfig {
  blurStyle: BlurStyle;
  backgroundColor: string;
  borderColors: string[];
  glowColor: string;
  overlayGradient: [string, string];
  scanlineColor: string;
}

const VARIANT_CONFIGS: Record<GlassVariant, VariantConfig> = {
  default: {
    blurStyle: 'standard',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderColors: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)'],
    glowColor: '#ffffff',
    overlayGradient: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0)'],
    scanlineColor: 'rgba(255, 255, 255, 0.05)',
  },
  frosted: {
    blurStyle: 'frosted',
    backgroundColor: 'rgba(40, 50, 70, 0.7)',
    borderColors: ['rgba(100, 150, 200, 0.3)', 'rgba(100, 150, 200, 0.1)'],
    glowColor: '#87ceeb',
    overlayGradient: ['rgba(200, 220, 255, 0.15)', 'rgba(200, 220, 255, 0)'],
    scanlineColor: 'rgba(200, 220, 255, 0.05)',
  },
  crystal: {
    blurStyle: 'crystal',
    backgroundColor: 'rgba(20, 30, 25, 0.6)',
    borderColors: ['rgba(16, 185, 129, 0.4)', 'rgba(139, 92, 246, 0.3)'],
    glowColor: '#10b981',
    overlayGradient: ['rgba(16, 185, 129, 0.15)', 'rgba(139, 92, 246, 0.1)'],
    scanlineColor: 'rgba(16, 185, 129, 0.08)',
  },
  neon: {
    blurStyle: 'neon',
    backgroundColor: 'rgba(15, 10, 30, 0.75)',
    borderColors: ['#00ffff', '#ff00ff', '#00ffff'],
    glowColor: '#00ffff',
    overlayGradient: ['rgba(0, 255, 255, 0.1)', 'rgba(255, 0, 255, 0.05)'],
    scanlineColor: 'rgba(0, 255, 255, 0.1)',
  },
  holographic: {
    blurStyle: 'holographic',
    backgroundColor: 'rgba(20, 20, 30, 0.65)',
    borderColors: ['#ff0080', '#ff8c00', '#ffff00', '#00ff00', '#00ffff', '#ff0080'],
    glowColor: '#ff00ff',
    overlayGradient: ['rgba(255, 0, 255, 0.1)', 'rgba(0, 255, 255, 0.1)'],
    scanlineColor: 'rgba(0, 255, 255, 0.08)',
  },
  aurora: {
    blurStyle: 'aurora',
    backgroundColor: 'rgba(10, 15, 30, 0.7)',
    borderColors: ['#10b981', '#06b6d4', '#8b5cf6', '#10b981'],
    glowColor: '#10b981',
    overlayGradient: ['rgba(0, 255, 170, 0.1)', 'rgba(100, 50, 200, 0.1)'],
    scanlineColor: 'rgba(0, 255, 200, 0.06)',
  },
  midnight: {
    blurStyle: 'midnight',
    backgroundColor: 'rgba(10, 10, 25, 0.85)',
    borderColors: ['rgba(80, 80, 160, 0.3)', 'rgba(40, 40, 80, 0.2)'],
    glowColor: '#6366f1',
    overlayGradient: ['rgba(80, 80, 160, 0.1)', 'rgba(40, 40, 80, 0.05)'],
    scanlineColor: 'rgba(100, 100, 200, 0.05)',
  },
  dawn: {
    blurStyle: 'dawn',
    backgroundColor: 'rgba(50, 30, 40, 0.7)',
    borderColors: ['#f97316', '#ec4899', '#f97316'],
    glowColor: '#f97316',
    overlayGradient: ['rgba(255, 150, 100, 0.12)', 'rgba(255, 100, 150, 0.08)'],
    scanlineColor: 'rgba(255, 150, 100, 0.06)',
  },
  ember: {
    blurStyle: 'ember',
    backgroundColor: 'rgba(30, 15, 10, 0.8)',
    borderColors: ['#fbbf24', '#f97316', '#dc2626', '#fbbf24'],
    glowColor: '#f97316',
    overlayGradient: ['rgba(255, 150, 50, 0.15)', 'rgba(200, 50, 50, 0.1)'],
    scanlineColor: 'rgba(255, 100, 50, 0.08)',
  },
  ocean: {
    blurStyle: 'ocean',
    backgroundColor: 'rgba(15, 30, 50, 0.75)',
    borderColors: ['#06b6d4', '#3b82f6', '#06b6d4'],
    glowColor: '#06b6d4',
    overlayGradient: ['rgba(0, 150, 255, 0.12)', 'rgba(50, 100, 200, 0.08)'],
    scanlineColor: 'rgba(0, 200, 255, 0.06)',
  },
};

// ============================================================================
// Depth Shadow Configurations
// ============================================================================

const DEPTH_SHADOWS: Record<string, ViewStyle[]> = {
  flat: [],
  shallow: [{ shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, shadowOpacity: 0.1 }],
  medium: [
    { shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, shadowOpacity: 0.1 },
    { shadowOffset: { width: 0, height: 8 }, shadowRadius: 16, shadowOpacity: 0.08 },
  ],
  deep: [
    { shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, shadowOpacity: 0.1 },
    { shadowOffset: { width: 0, height: 12 }, shadowRadius: 20, shadowOpacity: 0.15 },
    { shadowOffset: { width: 0, height: 20 }, shadowRadius: 40, shadowOpacity: 0.1 },
  ],
};

// ============================================================================
// Main Component
// ============================================================================

// AnimatedPressable can be used for advanced press animations
// const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GlassCardV2({
  children,
  variant = 'default',
  intensity = 'medium',
  borderRadius = 16,
  style,
  borderGradient = true,
  borderWidth = 1,
  borderColors,
  borderAnimation = 'none',
  borderAnimationDuration = 3000,
  animated = false,
  shimmerSpeed = 2000,
  shimmerDirection = 'right',
  depth = 'medium',
  shadowColor,
  innerGlow = false,
  outerGlow = false,
  glowColor,
  glowIntensity = 0.5,
  particles = false,
  particleType = 'sparkles',
  particleCount = 20,
  particleColors,
  scanlines = false,
  scanlineOpacity = 0.1,
  scanlineSpeed = 3000,
  pressable = false,
  pressAnimation = 'scale',
  onPress,
  onLongPress,
  hapticFeedback = true,
  testID,
  accessibilityLabel,
}: GlassCardV2Props) {
  const config = VARIANT_CONFIGS[variant];

  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const borderRotation = useSharedValue(0);
  const shimmerPosition = useSharedValue(0);
  const scanlineOffset = useSharedValue(0);
  const pressedShadow = useSharedValue(0);

  // ============================================================================
  // Animation Setup
  // ============================================================================

  useEffect(() => {
    // Border animation
    if (borderGradient && borderAnimation !== 'none') {
      switch (borderAnimation) {
        case 'rotate':
          borderRotation.value = withRepeat(
            withTiming(360, { duration: borderAnimationDuration, easing: Easing.linear }),
            -1,
            false
          );
          break;
        case 'pulse':
          borderRotation.value = withRepeat(
            withSequence(
              withTiming(10, { duration: borderAnimationDuration / 2 }),
              withTiming(0, { duration: borderAnimationDuration / 2 })
            ),
            -1,
            false
          );
          break;
        case 'breathe':
          glowOpacity.value = withRepeat(
            withSequence(
              withTiming(1, {
                duration: borderAnimationDuration / 2,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(0.3, {
                duration: borderAnimationDuration / 2,
                easing: Easing.inOut(Easing.ease),
              })
            ),
            -1,
            false
          );
          break;
      }
    }

    // Shimmer animation
    if (animated) {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: shimmerSpeed, easing: Easing.linear }),
        -1,
        false
      );
    }

    // Scanline animation
    if (scanlines) {
      scanlineOffset.value = withRepeat(
        withTiming(1, { duration: scanlineSpeed, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [borderAnimation, animated, scanlines, borderAnimationDuration, shimmerSpeed, scanlineSpeed]);

  // ============================================================================
  // Gesture Handlers
  // ============================================================================

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticFeedback]);

  const handlePressIn = useCallback(() => {
    if (pressAnimation === 'scale' || pressAnimation === 'all') {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    }
    if (pressAnimation === 'glow' || pressAnimation === 'all') {
      glowOpacity.value = withTiming(1, { duration: 150 });
    }
    if (pressAnimation === 'shadow' || pressAnimation === 'all') {
      pressedShadow.value = withTiming(1, { duration: 150 });
    }
    runOnJS(triggerHaptic)();
  }, [pressAnimation, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (pressAnimation === 'scale' || pressAnimation === 'all') {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
    if (pressAnimation === 'glow' || pressAnimation === 'all') {
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
    if (pressAnimation === 'shadow' || pressAnimation === 'all') {
      pressedShadow.value = withTiming(0, { duration: 200 });
    }
  }, [pressAnimation]);

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (onLongPress) {
        runOnJS(triggerHaptic)();
        runOnJS(onLongPress)();
      }
    });

  // ============================================================================
  // Animated Styles
  // ============================================================================

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * glowIntensity,
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${borderRotation.value}deg` }],
  }));

  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [0, 1],
      shimmerDirection === 'right' ? [-300, 300] : [300, -300]
    );
    return {
      transform: [{ translateX }],
    };
  });

  const animatedScanlineStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scanlineOffset.value, [0, 1], [0, 100]);
    return {
      transform: [{ translateY: `${translateY}%` }],
    };
  });

  const animatedShadowStyle = useAnimatedStyle(() => {
    const extraShadow = interpolate(pressedShadow.value, [0, 1], [0, 10]);
    return {
      shadowRadius: extraShadow,
      elevation: extraShadow,
    };
  });

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const finalBorderColors = useMemo(
    () => borderColors || config.borderColors,
    [borderColors, config.borderColors]
  );

  const finalGlowColor = useMemo(
    () => glowColor || config.glowColor,
    [glowColor, config.glowColor]
  );

  const finalShadowColor = useMemo(
    () => shadowColor || config.glowColor,
    [shadowColor, config.glowColor]
  );

  const depthShadows = useMemo(
    () =>
      DEPTH_SHADOWS[depth].map((shadow) => ({
        ...shadow,
        shadowColor: finalShadowColor,
      })),
    [depth, finalShadowColor]
  );

  const finalParticleColors = useMemo(
    () => particleColors || [config.glowColor, ...config.borderColors.slice(0, 2)],
    [particleColors, config]
  );

  // ============================================================================
  // Render
  // ============================================================================

  const cardContent = (
    <Animated.View
      style={[
        styles.container,
        { borderRadius },
        ...depthShadows,
        outerGlow && {
          shadowColor: finalGlowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowIntensity,
          shadowRadius: 20,
        },
        animatedContainerStyle,
        animatedShadowStyle,
        style,
      ]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Background blur layer */}
      <BlurViewCross
        intensity={intensity}
        tint="dark"
        style={config.blurStyle}
        borderRadius={borderRadius}
        containerStyle={StyleSheet.absoluteFill}
        animated={animated}
      />

      {/* Background color */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: config.backgroundColor, borderRadius }]}
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={config.overlayGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* Border gradient */}
      {borderGradient && (
        <Animated.View
          style={[styles.borderWrapper, { borderRadius }, animatedBorderStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={finalBorderColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.borderGradient, { borderRadius }]}
          />
          <View
            style={[
              styles.borderInner,
              {
                margin: borderWidth,
                borderRadius: borderRadius - borderWidth,
                backgroundColor: config.backgroundColor,
              },
            ]}
          />
        </Animated.View>
      )}

      {/* Inner glow */}
      {innerGlow && (
        <Animated.View
          style={[styles.innerGlow, { borderRadius }, animatedGlowStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[`${finalGlowColor}40`, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Shimmer effect */}
      {animated && (
        <Animated.View
          style={[styles.shimmerContainer, { borderRadius }, animatedShimmerStyle]}
          pointerEvents="none"
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

      {/* Scanlines */}
      {scanlines && (
        <Animated.View
          style={[styles.scanlinesContainer, { borderRadius }, animatedScanlineStyle]}
          pointerEvents="none"
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.scanline,
                {
                  top: `${i * 5}%`,
                  backgroundColor: config.scanlineColor,
                  opacity: scanlineOpacity,
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {/* Particle overlay */}
      {particles && (
        <ParticleView
          type={particleType}
          count={particleCount}
          colors={finalParticleColors}
          behavior="float"
          enabled={true}
          style={{ borderRadius }}
        />
      )}

      {/* Press glow overlay */}
      {(pressAnimation === 'glow' || pressAnimation === 'all') && (
        <Animated.View
          style={[
            styles.pressGlow,
            { borderRadius, backgroundColor: `${finalGlowColor}30` },
            animatedGlowStyle,
          ]}
          pointerEvents="none"
        />
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  if (pressable) {
    return (
      <GestureDetector gesture={longPressGesture}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{ borderRadius }}
        >
          {cardContent}
        </Pressable>
      </GestureDetector>
    );
  }

  return cardContent;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    zIndex: 10,
  },
  borderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  borderGradient: {
    flex: 1,
  },
  borderInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 300,
    zIndex: 3,
  },
  scanlinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  pressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
});

// ============================================================================
// Convenience Exports
// ============================================================================

export function FrostedCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="frosted" />;
}

export function CrystalCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="crystal" />;
}

export function NeonCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="neon" outerGlow scanlines />;
}

export function HolographicCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return (
    <GlassCardV2 {...props} variant="holographic" borderAnimation="rotate" scanlines particles />
  );
}

export function AuroraCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="aurora" borderAnimation="breathe" />;
}

export function MidnightCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="midnight" depth="deep" />;
}

export function DawnCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="dawn" innerGlow />;
}

export function EmberCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="ember" outerGlow particles particleType="sparkles" />;
}

export function OceanCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="ocean" animated />;
}
