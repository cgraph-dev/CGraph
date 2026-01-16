/**
 * BlurViewCross - Cross-Platform Blur Component
 *
 * Provides beautiful blur effects on all platforms:
 * - iOS 13+: Native UIVisualEffectView blur
 * - Android 12+: Native RenderEffect blur
 * - Android 9-11: Multi-layer gradient fallback
 *
 * Usage:
 * <BlurViewCross intensity={60} style="frosted" tint="dark">
 *   <YourContent />
 * </BlurViewCross>
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';

import BlurEngine, {
  BlurTint,
  BlurStyle,
  BlurIntensity,
  BlurLayerConfig,
  getBlurCapabilities,
  mapTintToExpoBlur,
} from './BlurEngine';

// ============================================================================
// Types
// ============================================================================

export interface BlurViewCrossProps {
  children?: React.ReactNode;
  intensity?: BlurIntensity | number;
  tint?: BlurTint;
  style?: BlurStyle;
  containerStyle?: StyleProp<ViewStyle>;
  animated?: boolean;
  experimentalBlurMethod?: 'none' | 'dimezisBlurView';
  borderRadius?: number;
  noiseOpacity?: number;
}

// ============================================================================
// Fallback Blur Layer Component
// ============================================================================

interface FallbackLayerProps {
  config: BlurLayerConfig;
  index: number;
  totalLayers: number;
  borderRadius?: number;
}

function FallbackLayer({ config, index, totalLayers, borderRadius = 0 }: FallbackLayerProps) {
  const gradient = BlurEngine.generateFallbackGradient(
    'standard', // Use standard for base layers
    config.tint,
    config.intensity
  );

  // Each layer has slightly different opacity for depth
  const layerOpacity = 1 - (index / totalLayers) * 0.3;

  return (
    <LinearGradient
      colors={gradient.colors as [string, string, ...string[]]}
      locations={gradient.locations}
      start={gradient.start}
      end={gradient.end}
      style={[StyleSheet.absoluteFill, { opacity: layerOpacity, borderRadius }]}
    />
  );
}

// ============================================================================
// Noise Overlay Component
// ============================================================================

interface NoiseOverlayProps {
  opacity: number;
  borderRadius?: number;
}

function NoiseOverlay({ opacity, borderRadius = 0 }: NoiseOverlayProps) {
  // Simple noise pattern using multiple semi-transparent dots
  // In production, could use a noise texture image for better effect
  return (
    <View
      style={[StyleSheet.absoluteFill, styles.noiseOverlay, { opacity, borderRadius }]}
      pointerEvents="none"
    />
  );
}

// ============================================================================
// Animated Shimmer Overlay
// ============================================================================

interface ShimmerOverlayProps {
  borderRadius?: number;
}

function ShimmerOverlay({ borderRadius = 0 }: ShimmerOverlayProps) {
  const translateX = useSharedValue(-300);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withSequence(withTiming(300, { duration: 2000 }), withTiming(-300, { duration: 0 })),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[styles.shimmerContainer, { borderRadius }, animatedStyle]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ============================================================================
// Main BlurViewCross Component
// ============================================================================

export default function BlurViewCross({
  children,
  intensity = 'medium',
  tint = 'dark',
  style = 'standard',
  containerStyle,
  animated = false,
  experimentalBlurMethod,
  borderRadius = 0,
  noiseOpacity,
}: BlurViewCrossProps) {
  const capabilities = useMemo(() => getBlurCapabilities(), []);

  const config = useMemo(
    () =>
      BlurEngine.createConfig({
        intensity: BlurEngine.getIntensityValue(intensity),
        tint,
        style,
        animated,
      }),
    [intensity, tint, style, animated]
  );

  const colors = useMemo(() => BlurEngine.getStyleColors(style, tint), [style, tint]);

  // Native blur for iOS and Android 12+
  if (!capabilities.useFallback && Platform.OS === 'ios') {
    return (
      <View style={[styles.container, containerStyle, { borderRadius }]}>
        <BlurView
          intensity={config.intensity}
          tint={mapTintToExpoBlur(tint)}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          experimentalBlurMethod={experimentalBlurMethod}
        />

        {/* Style-specific overlay */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, borderRadius }]}
        />

        {/* Optional noise texture */}
        {(noiseOpacity ?? colors.noise) > 0 && (
          <NoiseOverlay opacity={noiseOpacity ?? colors.noise} borderRadius={borderRadius} />
        )}

        {/* Animated shimmer */}
        {animated && <ShimmerOverlay borderRadius={borderRadius} />}

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  // Native blur for Android 12+ (expo-blur works here too)
  if (!capabilities.useFallback && Platform.OS === 'android') {
    return (
      <View style={[styles.container, containerStyle, { borderRadius }]}>
        <BlurView
          intensity={config.intensity}
          tint={mapTintToExpoBlur(tint)}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          experimentalBlurMethod={experimentalBlurMethod || 'dimezisBlurView'}
        />

        {/* Style-specific overlay */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, borderRadius }]}
        />

        {/* Optional noise texture */}
        {(noiseOpacity ?? colors.noise) > 0 && (
          <NoiseOverlay opacity={noiseOpacity ?? colors.noise} borderRadius={borderRadius} />
        )}

        {/* Animated shimmer */}
        {animated && <ShimmerOverlay borderRadius={borderRadius} />}

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  // Fallback for Android 9-11: Multi-layer gradient simulation
  const layerCount = BlurEngine.getOptimalLayers(config.intensity);

  return (
    <View style={[styles.container, containerStyle, { borderRadius }]}>
      {/* Base background */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, borderRadius }]}
      />

      {/* Multi-layer gradients for depth */}
      {Array.from({ length: layerCount }).map((_, index) => (
        <FallbackLayer
          key={index}
          config={config}
          index={index}
          totalLayers={layerCount}
          borderRadius={borderRadius}
        />
      ))}

      {/* Style-specific gradient overlay */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.5, borderRadius }]}
      />

      {/* Subtle border for glass effect */}
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.borderOverlay,
          { borderColor: colors.border, borderRadius },
        ]}
      />

      {/* Optional noise texture */}
      {(noiseOpacity ?? colors.noise) > 0 && (
        <NoiseOverlay opacity={noiseOpacity ?? colors.noise} borderRadius={borderRadius} />
      )}

      {/* Inner highlight for glassy appearance */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.5, borderRadius }]}
      />

      {/* Animated shimmer */}
      {animated && <ShimmerOverlay borderRadius={borderRadius} />}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
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
  noiseOverlay: {
    // Pseudo-noise using repeating linear gradients
    // Real implementation would use an actual noise texture
    backgroundColor: 'transparent',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 300,
    zIndex: 5,
  },
  borderOverlay: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});

// ============================================================================
// Convenience Components
// ============================================================================

export function LightBlur(props: Omit<BlurViewCrossProps, 'tint'>) {
  return <BlurViewCross {...props} tint="light" />;
}

export function DarkBlur(props: Omit<BlurViewCrossProps, 'tint'>) {
  return <BlurViewCross {...props} tint="dark" />;
}

export function FrostedGlass(props: Omit<BlurViewCrossProps, 'style'>) {
  return <BlurViewCross {...props} style="frosted" />;
}

export function CrystalGlass(props: Omit<BlurViewCrossProps, 'style'>) {
  return <BlurViewCross {...props} style="crystal" />;
}

export function NeonGlass(props: Omit<BlurViewCrossProps, 'style'>) {
  return <BlurViewCross {...props} style="neon" />;
}

export function HolographicGlass(props: Omit<BlurViewCrossProps, 'style'>) {
  return <BlurViewCross {...props} style="holographic" />;
}

export function AuroraGlass(props: Omit<BlurViewCrossProps, 'style'>) {
  return <BlurViewCross {...props} style="aurora" />;
}

export function MidnightGlass(props: Omit<BlurViewCrossProps, 'style'>) {
  return <BlurViewCross {...props} style="midnight" />;
}

export function OceanGlass(props: Omit<BlurViewCrossProps, 'style'>) {
  return <BlurViewCross {...props} style="ocean" />;
}

export function EmberGlass(props: Omit<BlurViewCrossProps, 'style'>) {
  return <BlurViewCross {...props} style="ember" />;
}
