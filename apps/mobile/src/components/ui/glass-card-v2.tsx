/** GlassCard V2 - Next-Generation Glassmorphism Component */

import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';

import BlurViewCross from '@/lib/effects/blur-view-cross';
import ParticleView from '@/lib/effects/particle-view';

export type {
  GlassVariant,
  BorderAnimationMode,
  PressAnimation,
  GlassCardV2Props,
} from './glass-card-v2.types';
import type { GlassCardV2Props } from './glass-card-v2.types';

import { VARIANT_CONFIGS, DEPTH_SHADOWS } from './glass-card-v2.config';
import { useGlassAnimations } from './glass-card-v2.animations';
import { useGlassGestures } from './glass-card-v2.gestures';
import { styles } from './glass-card-v2.styles';

export {
  FrostedCard,
  CrystalCard,
  NeonCard,
  HolographicCard,
  AuroraCard,
  MidnightCard,
  DawnCard,
  EmberCard,
  OceanCard,
} from './glass-card-v2.variants';

/**
 * Glass Card V2 component.
 *
 */
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

  // Animations
  const {
    scale,
    glowOpacity,
    pressedShadow,
    animatedContainerStyle,
    animatedGlowStyle,
    animatedBorderStyle,
    animatedShimmerStyle,
    animatedScanlineStyle,
    animatedShadowStyle,
  } = useGlassAnimations({
    borderGradient,
    borderAnimation,
    borderAnimationDuration,
    animated,
    shimmerSpeed,
    shimmerDirection,
    scanlines,
    scanlineSpeed,
    glowIntensity,
  });

  // Gestures
  const { handlePressIn, handlePressOut, longPressGesture } = useGlassGestures({
    pressAnimation,
    hapticFeedback,
    onLongPress,
    scale,
    glowOpacity,
    pressedShadow,
  });

  // Memoized Values
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
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
