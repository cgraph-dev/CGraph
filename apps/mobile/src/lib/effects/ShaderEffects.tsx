/**
 * ShaderEffects - Advanced Visual Shader Effects for React Native
 *
 * Features:
 * - Scanline overlay system (speed, opacity, color)
 * - Holographic color shift (iridescent gradient)
 * - Glitch effects (controlled chaos)
 * - Chromatic aberration (RGB split)
 * - Film grain overlay
 * - Vignette effects
 * - CRT monitor simulation
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ShaderType =
  | 'scanlines'
  | 'holographic'
  | 'glitch'
  | 'chromatic'
  | 'grain'
  | 'vignette'
  | 'crt';

export interface ScanlineConfig {
  opacity: number; // 0-1
  speed: number; // Animation speed in ms
  color: string;
  spacing: number; // Pixels between lines
  thickness: number; // Line thickness in pixels
  direction: 'horizontal' | 'vertical';
  animated: boolean;
}

export interface GlitchConfig {
  intensity: number; // 0-1
  frequency: number; // Glitches per second
  colorShift: boolean;
  sliceCount: number; // Number of glitch slices
  duration: number; // Glitch duration in ms
}

export interface ChromaticConfig {
  offset: number; // Pixel offset for RGB channels
  angle: number; // Direction of aberration in degrees
  animated: boolean;
  pulseSpeed: number;
}

export interface HolographicConfig {
  colors: string[];
  speed: number;
  angle: number;
  intensity: number;
}

export interface GrainConfig {
  opacity: number;
  size: number;
  animated: boolean;
  speed: number;
}

export interface VignetteConfig {
  intensity: number; // 0-1
  radius: number; // 0-1 from center
  softness: number; // 0-1 edge softness
  color: string;
}

export interface CRTConfig {
  scanlines: boolean;
  curvature: number; // 0-1
  vignette: boolean;
  flicker: boolean;
  flickerIntensity: number;
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_SCANLINE_CONFIG: ScanlineConfig = {
  opacity: 0.1,
  speed: 3000,
  color: 'rgba(0, 255, 255, 0.1)',
  spacing: 4,
  thickness: 1,
  direction: 'horizontal',
  animated: true,
};

const DEFAULT_GLITCH_CONFIG: GlitchConfig = {
  intensity: 0.5,
  frequency: 2,
  colorShift: true,
  sliceCount: 5,
  duration: 150,
};

const DEFAULT_CHROMATIC_CONFIG: ChromaticConfig = {
  offset: 2,
  angle: 0,
  animated: false,
  pulseSpeed: 2000,
};

const DEFAULT_HOLOGRAPHIC_CONFIG: HolographicConfig = {
  colors: ['#ff0080', '#ff8c00', '#ffff00', '#00ff00', '#00ffff', '#ff0080'],
  speed: 3000,
  angle: 45,
  intensity: 0.3,
};

const DEFAULT_GRAIN_CONFIG: GrainConfig = {
  opacity: 0.05,
  size: 2,
  animated: true,
  speed: 100,
};

const DEFAULT_VIGNETTE_CONFIG: VignetteConfig = {
  intensity: 0.5,
  radius: 0.7,
  softness: 0.5,
  color: '#000000',
};

const DEFAULT_CRT_CONFIG: CRTConfig = {
  scanlines: true,
  curvature: 0.1,
  vignette: true,
  flicker: true,
  flickerIntensity: 0.02,
};

// ============================================================================
// Scanline Effect Component
// ============================================================================

export interface ScanlineEffectProps {
  config?: Partial<ScanlineConfig>;
  style?: StyleProp<ViewStyle>;
}

export function ScanlineEffect({ config, style }: ScanlineEffectProps) {
  const mergedConfig = { ...DEFAULT_SCANLINE_CONFIG, ...config };
  const scanlineOffset = useSharedValue(0);

  useEffect(() => {
    if (mergedConfig.animated) {
      scanlineOffset.value = withRepeat(
        withTiming(1, { duration: mergedConfig.speed, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [mergedConfig.animated, mergedConfig.speed]);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = interpolate(scanlineOffset.value, [0, 1], [0, 100]);
    return {
      transform: [
        mergedConfig.direction === 'horizontal' ? { translateY: offset } : { translateX: offset },
      ],
    };
  });

  const lineCount = Math.ceil(
    (mergedConfig.direction === 'horizontal'
      ? Dimensions.get('window').height
      : Dimensions.get('window').width) /
      (mergedConfig.spacing + mergedConfig.thickness)
  );

  return (
    <View style={[styles.effectContainer, style]} pointerEvents="none">
      {/* Static scanline pattern */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: mergedConfig.opacity,
          },
        ]}
      >
        {Array.from({ length: lineCount * 2 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.scanline,
              {
                backgroundColor: mergedConfig.color,
                height: mergedConfig.thickness,
                top: i * (mergedConfig.spacing + mergedConfig.thickness),
              },
            ]}
          />
        ))}
      </View>

      {/* Animated sweep line */}
      {mergedConfig.animated && (
        <Animated.View
          style={[
            styles.sweepLine,
            {
              backgroundColor: mergedConfig.color,
              opacity: mergedConfig.opacity * 3,
            },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
}

// ============================================================================
// Holographic Effect Component
// ============================================================================

export interface HolographicEffectProps {
  config?: Partial<HolographicConfig>;
  style?: StyleProp<ViewStyle>;
}

export function HolographicEffect({ config, style }: HolographicEffectProps) {
  const mergedConfig = { ...DEFAULT_HOLOGRAPHIC_CONFIG, ...config };
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: mergedConfig.speed, easing: Easing.linear }),
      -1,
      false
    );
  }, [mergedConfig.speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.effectContainer, style]} pointerEvents="none">
      <Animated.View style={[styles.holographicWrapper, animatedStyle]}>
        <LinearGradient
          colors={mergedConfig.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: mergedConfig.intensity }]}
        />
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Glitch Effect Component
// ============================================================================

export interface GlitchEffectProps {
  config?: Partial<GlitchConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GlitchEffect({ config, style, children }: GlitchEffectProps) {
  const mergedConfig = { ...DEFAULT_GLITCH_CONFIG, ...config };

  const glitchActive = useSharedValue(0);

  // Pre-create a fixed number of shared values (max slice count)
  // Using individual hooks to satisfy React's rules of hooks
  const slice0 = useSharedValue(0);
  const slice1 = useSharedValue(0);
  const slice2 = useSharedValue(0);
  const slice3 = useSharedValue(0);
  const slice4 = useSharedValue(0);
  const sliceOffsets = [slice0, slice1, slice2, slice3, slice4].slice(0, mergedConfig.sliceCount);

  useEffect(() => {
    const triggerGlitch = () => {
      // Activate glitch
      glitchActive.value = withSequence(
        withTiming(1, { duration: 50 }),
        withDelay(mergedConfig.duration, withTiming(0, { duration: 50 }))
      );

      // Randomize slice offsets
      sliceOffsets.forEach((offset) => {
        const randomOffset = (Math.random() - 0.5) * 20 * mergedConfig.intensity;
        offset.value = withSequence(
          withTiming(randomOffset, { duration: 50 }),
          withDelay(mergedConfig.duration, withTiming(0, { duration: 50 }))
        );
      });
    };

    const interval = setInterval(triggerGlitch, 1000 / mergedConfig.frequency);
    return () => clearInterval(interval);
  }, [mergedConfig.frequency, mergedConfig.intensity, mergedConfig.duration, sliceOffsets]);

  const mainStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glitchActive.value, [0, 1], [1, 0.95]),
  }));

  return (
    <View style={[style]}>
      <Animated.View style={mainStyle}>{children}</Animated.View>

      {/* Color shift overlays */}
      {mergedConfig.colorShift && (
        <>
          <GlitchColorLayer color="rgba(255, 0, 0, 0.1)" offset={sliceOffsets[0]} />
          <GlitchColorLayer color="rgba(0, 255, 255, 0.1)" offset={sliceOffsets[1]} />
        </>
      )}
    </View>
  );
}

interface GlitchColorLayerProps {
  color: string;
  offset: SharedValue<number>;
}

function GlitchColorLayer({ color, offset }: GlitchColorLayerProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
    backgroundColor: color,
  }));

  return <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none" />;
}

// ============================================================================
// Chromatic Aberration Effect Component
// ============================================================================

export interface ChromaticEffectProps {
  config?: Partial<ChromaticConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function ChromaticEffect({ config, style, children }: ChromaticEffectProps) {
  const mergedConfig = { ...DEFAULT_CHROMATIC_CONFIG, ...config };
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (mergedConfig.animated) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: mergedConfig.pulseSpeed / 2 }),
          withTiming(1, { duration: mergedConfig.pulseSpeed / 2 })
        ),
        -1,
        false
      );
    }
  }, [mergedConfig.animated, mergedConfig.pulseSpeed]);

  const angleRad = (mergedConfig.angle * Math.PI) / 180;
  const offsetX = Math.cos(angleRad) * mergedConfig.offset;
  const offsetY = Math.sin(angleRad) * mergedConfig.offset;

  const redStyle = useAnimatedStyle(() => {
    const scale = mergedConfig.animated ? pulseValue.value : 1;
    return {
      transform: [{ translateX: -offsetX * scale }, { translateY: -offsetY * scale }],
    };
  });

  const blueStyle = useAnimatedStyle(() => {
    const scale = mergedConfig.animated ? pulseValue.value : 1;
    return {
      transform: [{ translateX: offsetX * scale }, { translateY: offsetY * scale }],
    };
  });

  return (
    <View style={[style]}>
      {/* Red channel offset */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }, redStyle]}
        pointerEvents="none"
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 0, 0, 0.1)' }]} />
      </Animated.View>

      {/* Main content */}
      {children}

      {/* Blue channel offset */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }, blueStyle]}
        pointerEvents="none"
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 255, 0.1)' }]} />
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Grain Effect Component
// ============================================================================

export interface GrainEffectProps {
  config?: Partial<GrainConfig>;
  style?: StyleProp<ViewStyle>;
}

export function GrainEffect({ config, style }: GrainEffectProps) {
  const mergedConfig = { ...DEFAULT_GRAIN_CONFIG, ...config };
  const noiseOffset = useSharedValue(0);

  useEffect(() => {
    if (mergedConfig.animated) {
      noiseOffset.value = withRepeat(
        withTiming(100, { duration: mergedConfig.speed, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [mergedConfig.animated, mergedConfig.speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: noiseOffset.value % 10 }, { translateY: noiseOffset.value % 7 }],
  }));

  // Generate pseudo-noise pattern
  const dotCount = 200;
  const dots = useMemo(
    () =>
      Array.from({ length: dotCount }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: Math.random() * mergedConfig.opacity,
        size: Math.random() * mergedConfig.size + 1,
      })),
    [mergedConfig.opacity, mergedConfig.size]
  );

  return (
    <View style={[styles.effectContainer, style]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        {dots.map((dot, i) => (
          <View
            key={i}
            style={[
              styles.grainDot,
              {
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: dot.size,
                height: dot.size,
                opacity: dot.opacity,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Vignette Effect Component
// ============================================================================

export interface VignetteEffectProps {
  config?: Partial<VignetteConfig>;
  style?: StyleProp<ViewStyle>;
}

export function VignetteEffect({ config, style }: VignetteEffectProps) {
  const mergedConfig = { ...DEFAULT_VIGNETTE_CONFIG, ...config };

  return (
    <View style={[styles.effectContainer, style]} pointerEvents="none">
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            // Radial gradient simulation using border radius
            borderRadius: 9999,
            transform: [{ scale: 2 }],
            backgroundColor: 'transparent',
            borderWidth: Dimensions.get('window').width * (1 - mergedConfig.radius),
            borderColor: mergedConfig.color,
            opacity: mergedConfig.intensity,
          },
        ]}
      />
    </View>
  );
}

// ============================================================================
// CRT Monitor Effect Component
// ============================================================================

export interface CRTEffectProps {
  config?: Partial<CRTConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function CRTEffect({ config, style, children }: CRTEffectProps) {
  const mergedConfig = { ...DEFAULT_CRT_CONFIG, ...config };
  const flickerOpacity = useSharedValue(1);

  useEffect(() => {
    if (mergedConfig.flicker) {
      flickerOpacity.value = withRepeat(
        withSequence(
          withTiming(1 - mergedConfig.flickerIntensity, { duration: 50 }),
          withTiming(1, { duration: 50 }),
          withTiming(1 - mergedConfig.flickerIntensity * 0.5, { duration: 100 }),
          withTiming(1, { duration: 100 })
        ),
        -1,
        false
      );
    }
  }, [mergedConfig.flicker, mergedConfig.flickerIntensity]);

  const flickerStyle = useAnimatedStyle(() => ({
    opacity: flickerOpacity.value,
  }));

  return (
    <View style={[style]}>
      <Animated.View style={[{ flex: 1 }, flickerStyle]}>{children}</Animated.View>

      {/* Scanlines */}
      {mergedConfig.scanlines && (
        <ScanlineEffect
          config={{
            opacity: 0.08,
            spacing: 3,
            thickness: 1,
            animated: true,
            speed: 5000,
          }}
        />
      )}

      {/* Vignette */}
      {mergedConfig.vignette && (
        <VignetteEffect
          config={{
            intensity: 0.4,
            radius: 0.8,
          }}
        />
      )}

      {/* Screen curvature overlay */}
      {mergedConfig.curvature > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 30 * mergedConfig.curvature,
              borderWidth: 2,
              borderColor: 'rgba(0, 0, 0, 0.3)',
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

// ============================================================================
// Combined Shader Overlay Component
// ============================================================================

export interface ShaderOverlayProps {
  effects?: ShaderType[];
  scanlines?: Partial<ScanlineConfig>;
  holographic?: Partial<HolographicConfig>;
  glitch?: Partial<GlitchConfig>;
  chromatic?: Partial<ChromaticConfig>;
  grain?: Partial<GrainConfig>;
  vignette?: Partial<VignetteConfig>;
  crt?: Partial<CRTConfig>;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function ShaderOverlay({
  effects = [],
  scanlines,
  holographic,
  glitch,
  chromatic,
  grain,
  vignette,
  crt,
  style,
  children,
}: ShaderOverlayProps) {
  return (
    <View style={[styles.effectContainer, style]}>
      {children}

      {effects.includes('scanlines') && <ScanlineEffect config={scanlines} />}
      {effects.includes('holographic') && <HolographicEffect config={holographic} />}
      {effects.includes('glitch') && <GlitchEffect config={glitch} />}
      {effects.includes('chromatic') && <ChromaticEffect config={chromatic} />}
      {effects.includes('grain') && <GrainEffect config={grain} />}
      {effects.includes('vignette') && <VignetteEffect config={vignette} />}
      {effects.includes('crt') && <CRTEffect config={crt} />}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  effectContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  sweepLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  holographicWrapper: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
  },
  grainDot: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 999,
  },
});

// ============================================================================
// Default Export
// ============================================================================

const ShaderEffects = {
  // Components
  ScanlineEffect,
  HolographicEffect,
  GlitchEffect,
  ChromaticEffect,
  GrainEffect,
  VignetteEffect,
  CRTEffect,
  ShaderOverlay,

  // Default configs
  DEFAULT_SCANLINE_CONFIG,
  DEFAULT_GLITCH_CONFIG,
  DEFAULT_CHROMATIC_CONFIG,
  DEFAULT_HOLOGRAPHIC_CONFIG,
  DEFAULT_GRAIN_CONFIG,
  DEFAULT_VIGNETTE_CONFIG,
  DEFAULT_CRT_CONFIG,
};

export default ShaderEffects;
