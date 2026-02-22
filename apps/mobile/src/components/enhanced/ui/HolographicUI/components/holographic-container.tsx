import React, { ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Platform, Easing, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { HolographicConfig, getTheme, getIntensityMultiplier } from '../types';
import { CornerDecoration, Scanlines } from './decorations';

interface HolographicContainerProps {
  children: ReactNode;
  config?: Partial<HolographicConfig>;
  style?: ViewStyle;
  onPress?: () => void;
}

export function HolographicContainer({
  children,
  config: userConfig,
  style,
  onPress,
}: HolographicContainerProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const flickerOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  const config: HolographicConfig = {
    intensity: userConfig?.intensity ?? 'medium',
    colorTheme: userConfig?.colorTheme ?? 'cyan',
    enableScanlines: userConfig?.enableScanlines ?? true,
    enableFlicker: userConfig?.enableFlicker ?? true,
    enableHaptics: userConfig?.enableHaptics ?? true,
    glitchProbability: userConfig?.glitchProbability ?? 0.02,
    ...userConfig,
  };

  const theme = getTheme(config.colorTheme, config.customColors);
  const intensityMultiplier = getIntensityMultiplier(config.intensity);

  // Glow pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Flicker effect
  useEffect(() => {
    if (!config.enableFlicker) return;

    const flickerInterval = setInterval(() => {
      const randomOpacity = 0.95 + Math.random() * 0.05;
      flickerOpacity.setValue(randomOpacity);
    }, 100);

    return () => clearInterval(flickerInterval);
  }, [config.enableFlicker]);

  // Random glitch effect
  useEffect(() => {
    if (!config.enableFlicker) return;

    const glitchInterval = setInterval(() => {
      if (Math.random() < config.glitchProbability) {
        setIsGlitching(true);
        if (config.enableHaptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setTimeout(() => setIsGlitching(false), 100 + Math.random() * 150);
      }
    }, 500);

    return () => clearInterval(glitchInterval);
  }, [config.enableFlicker, config.glitchProbability, config.enableHaptics]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();

    if (config.enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [config.enableHaptics]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const Container = onPress ? Pressable : View;
  const containerProps = onPress
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
      }
    : {};

  return (
    <Animated.View
      style={[
        styles.holographicContainer,
        {
          opacity: flickerOpacity,
          transform: [{ scale: scaleAnim }],
          borderColor: theme.primary,
          backgroundColor: theme.background,
        },
        // Shadow for glow effect (iOS)
        Platform.OS === 'ios' && {
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 20 * intensityMultiplier,
        },
        style,
      ]}
    >
      <Container {...containerProps} style={styles.containerInner}>
        {/* Holographic gradient overlay */}
        <LinearGradient
          colors={['transparent', theme.glow, 'transparent', theme.glow, 'transparent'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientOverlay, { opacity: 0.1 * intensityMultiplier }]}
        />

        {/* Scanlines */}
        {config.enableScanlines && (
          <Scanlines color={theme.scanline} intensity={intensityMultiplier} />
        )}

        {/* Glitch overlay */}
        {isGlitching && (
          <LinearGradient
            colors={['transparent', theme.accent, 'transparent'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.glitchOverlay}
          />
        )}

        {/* Corner decorations */}
        <CornerDecoration color={theme.primary} position="topLeft" />
        <CornerDecoration color={theme.primary} position="topRight" />
        <CornerDecoration color={theme.primary} position="bottomLeft" />
        <CornerDecoration color={theme.primary} position="bottomRight" />

        {/* Content */}
        <View style={styles.contentContainer}>{children}</View>
      </Container>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  holographicContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  containerInner: {
    flex: 1,
  },
  contentContainer: {
    position: 'relative',
    zIndex: 10,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  glitchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    pointerEvents: 'none',
  },
});
