/**
 * AnimatedGradient - React Native Animated Gradient Components
 *
 * Features:
 * - Smooth gradient transitions
 * - Rotating gradients
 * - Pulsing effects
 * - Shimmer animations
 * - Border gradient animations
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

import GradientEngine, {
  GradientConfig,
  GlowConfig,
  GRADIENT_PRESETS,
  GLOW_PRESETS,
} from './gradient-engine';

// ============================================================================
// Animated Linear Gradient
// ============================================================================

// Note: AnimatedLinearGradient can be used for direct gradient animations
// const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export interface AnimatedGradientProps {
  preset?: keyof typeof GRADIENT_PRESETS;
  config?: GradientConfig;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  borderRadius?: number;
}

/**
 *
 */
export function AnimatedGradientView({
  preset,
  config,
  style,
  children,
  borderRadius = 0,
}: AnimatedGradientProps) {
  const gradientConfig = useMemo(() => {
    if (config) return config;
    if (preset && GRADIENT_PRESETS[preset]) return GRADIENT_PRESETS[preset];
    return GRADIENT_PRESETS.primary;
  }, [preset, config]);

  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const shimmerPosition = useSharedValue(0);

  // Animation setup
  useEffect(() => {
    if (!gradientConfig.animated) return;

    const duration = gradientConfig.animationDuration || 3000;

    switch (gradientConfig.animationType) {
      case 'rotate':
        rotation.value = withRepeat(
          withTiming(360, { duration, easing: Easing.linear }),
          -1,
          false
        );
        break;

      case 'pulse':
        pulse.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        break;

      case 'shimmer':
        shimmerPosition.value = withRepeat(
          withTiming(1, { duration, easing: Easing.linear }),
          -1,
          false
        );
        break;

      default:
        break;
    }
  }, [gradientConfig]);

  const gradientData = useMemo(
    () => GradientEngine.createLinearGradient(gradientConfig),
    [gradientConfig]
  );

  // Animated rotation style
  const animatedRotationStyle = useAnimatedStyle(() => {
    if (gradientConfig.animationType !== 'rotate') return {};
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Animated pulse style
  const animatedPulseStyle = useAnimatedStyle(() => {
    if (gradientConfig.animationType !== 'pulse') return {};
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  const combinedStyle = [
    StyleSheet.absoluteFill,
    { borderRadius },
    gradientConfig.animationType === 'rotate' && animatedRotationStyle,
    gradientConfig.animationType === 'pulse' && animatedPulseStyle,
  ].filter(Boolean);

  return (
    <View style={[styles.container, style, { borderRadius }]}>
      <Animated.View style={combinedStyle}>
        <LinearGradient
           
          colors={gradientData.colors as [string, string, ...string[]]}
           
          locations={gradientData.locations as [number, number, ...number[]]}
          start={gradientData.start}
          end={gradientData.end}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      </Animated.View>

      {/* Shimmer overlay */}
      {gradientConfig.animationType === 'shimmer' && (
        <ShimmerOverlay position={shimmerPosition} borderRadius={borderRadius} />
      )}

      {/* Content */}
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
}

// ============================================================================
// Shimmer Overlay
// ============================================================================

interface ShimmerOverlayProps {
  position: SharedValue<number>;
  borderRadius: number;
}

function ShimmerOverlay({ position, borderRadius }: ShimmerOverlayProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(position.value, [0, 1], [-300, 300]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View style={[styles.shimmerContainer, { borderRadius }, animatedStyle]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ============================================================================
// Animated Border Gradient
// ============================================================================

export interface AnimatedBorderGradientProps {
  colors?: string[];
  width?: number;
  borderRadius?: number;
  animated?: boolean;
  animationDuration?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 *
 */
export function AnimatedBorderGradient({
  colors = ['#10b981', '#8b5cf6', '#ec4899', '#10b981'],
  width = 2,
  borderRadius = 16,
  animated = true,
  animationDuration = 3000,
  style,
  children,
}: AnimatedBorderGradientProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withTiming(360, { duration: animationDuration, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animated, animationDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.borderContainer, { borderRadius }, style]}>
      {/* Gradient border (enlarged and clipped) */}
      <Animated.View style={[styles.gradientBorderWrapper, animatedStyle]}>
        <LinearGradient
           
          colors={colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBorder, { borderRadius: borderRadius + width }]}
        />
      </Animated.View>

      {/* Inner content container (clips the gradient) */}
      <View
        style={[
          styles.innerContainer,
          {
            margin: width,
            borderRadius: borderRadius - width,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

// ============================================================================
// Glow View
// ============================================================================

export interface GlowViewProps {
  preset?: keyof typeof GLOW_PRESETS;
  config?: Partial<GlowConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  layers?: number;
}

/**
 *
 */
export function GlowView({ preset = 'soft', config, style, children, layers = 3 }: GlowViewProps) {
  const glowConfig: GlowConfig = useMemo(
    () => ({
      ...GLOW_PRESETS[preset],
      ...config,
    }),
    [preset, config]
  );

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (glowConfig.animated && glowConfig.pulseSpeed) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.3, {
            duration: glowConfig.pulseSpeed / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: glowConfig.pulseSpeed / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [glowConfig]);

  const glowStyles = useMemo(
    () => GradientEngine.createMultiLayerGlow(glowConfig, layers),
    [glowConfig, layers]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!glowConfig.animated) return {};
    return {
      transform: [{ scale: pulse.value }],
    };
  });

  return (
    <View style={[style]}>
      {/* Glow layers */}
      {glowStyles.map((glowStyle, index) => (
        <Animated.View key={index} style={[StyleSheet.absoluteFill, glowStyle, animatedStyle]} />
      ))}

      {/* Content */}
      {children}
    </View>
  );
}

// ============================================================================
// Mesh Gradient Background
// ============================================================================

export interface MeshGradientProps {
  colors: string[];
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
  children?: React.ReactNode;
}

/**
 *
 */
export function MeshGradientBackground({
  colors,
  style,
  animated = false,
  children,
}: MeshGradientProps) {
  const offset1 = useSharedValue(0);
  const offset2 = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      offset1.value = withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      offset2.value = withRepeat(
        withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [animated]);

  const layer1Style = useAnimatedStyle(() => {
    const x = interpolate(offset1.value, [0, 1], [0, 50]);
    const y = interpolate(offset1.value, [0, 1], [0, 30]);
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  const layer2Style = useAnimatedStyle(() => {
    const x = interpolate(offset2.value, [0, 1], [50, 0]);
    const y = interpolate(offset2.value, [0, 1], [30, 0]);
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  });

  const color1 = colors[0] || '#10b981';
  const color2 = colors[1] || '#8b5cf6';
  const color3 = colors[2] || '#ec4899';

  return (
    <View style={[styles.meshContainer, style]}>
      {/* Base layer */}
      <LinearGradient
         
        colors={[color1, color2] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated overlay layers */}
      <Animated.View style={[styles.meshLayer, layer1Style]}>
        <LinearGradient
           
          colors={[`${color2}80`, 'transparent'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.meshLayer, layer2Style]}>
        <LinearGradient
           
          colors={[`${color3}60`, 'transparent'] as [string, string]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content */}
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
}

// ============================================================================
// Preset Exports
// ============================================================================

/**
 *
 */
export function AuroraGradient(props: Omit<AnimatedGradientProps, 'preset'>) {
  return <AnimatedGradientView {...props} preset="aurora" />;
}

/**
 *
 */
export function NeonGradient(props: Omit<AnimatedGradientProps, 'preset'>) {
  return <AnimatedGradientView {...props} preset="neonCyber" />;
}

/**
 *
 */
export function HolographicGradient(props: Omit<AnimatedGradientProps, 'preset'>) {
  return <AnimatedGradientView {...props} preset="holographic" />;
}

/**
 *
 */
export function SunsetGradient(props: Omit<AnimatedGradientProps, 'preset'>) {
  return <AnimatedGradientView {...props} preset="sunset" />;
}

/**
 *
 */
export function OceanGradient(props: Omit<AnimatedGradientProps, 'preset'>) {
  return <AnimatedGradientView {...props} preset="ocean" />;
}

/**
 *
 */
export function EmberGradient(props: Omit<AnimatedGradientProps, 'preset'>) {
  return <AnimatedGradientView {...props} preset="ember" />;
}

/**
 *
 */
export function MatrixGradient(props: Omit<AnimatedGradientProps, 'preset'>) {
  return <AnimatedGradientView {...props} preset="matrix" />;
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
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 300,
    zIndex: 5,
  },
  borderContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBorderWrapper: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
  },
  gradientBorder: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#1f2937', // Dark background for contrast
    overflow: 'hidden',
  },
  meshContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  meshLayer: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
  },
});
