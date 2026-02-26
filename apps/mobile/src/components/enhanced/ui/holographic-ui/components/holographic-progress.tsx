/**
 * Holographic-themed progress bar component with animated fill and gradient effects.
 * @module components/enhanced/ui/holographic-ui/HolographicProgress
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, { useSharedValue, withTiming, withRepeat, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { HolographicConfig, getTheme } from '../types';
import { HolographicText } from './holographic-text';

interface HolographicProgressProps {
  progress: number; // 0 to 1
  label?: string;
  showPercentage?: boolean;
  height?: number;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

/**
 *
 */
export function HolographicProgress({
  progress,
  label,
  showPercentage = true,
  height = 8,
  colorTheme = 'cyan',
  style,
}: HolographicProgressProps) {
  const theme = getTheme(colorTheme);
  const progressAnim = useSharedValue(0);
  const shineAnim = useSharedValue(0);

  const clampedProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    progressAnim.value = withTiming(clampedProgress, { duration: 500 });
  }, [clampedProgress]);

  useEffect(() => {
    // Shine animation loop
    shineAnim.value = 0;
    shineAnim.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const progressWidthStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`,
  }));

  const shinePositionStyle = useAnimatedStyle(() => ({
    left: `${interpolate(shineAnim.value, [0, 1], [-50, 150])}%`,
  }));

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          <HolographicText variant="label" colorTheme={colorTheme}>
            {label}
          </HolographicText>
          {showPercentage && (
            <HolographicText variant="label" colorTheme={colorTheme}>
              {Math.round(clampedProgress * 100)}%
            </HolographicText>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: `${theme.secondary}30`,
            borderColor: `${theme.secondary}50`,
          },
        ]}
      >
        <Animated.View style={[styles.progressFill, progressWidthStyle]}>
          <LinearGradient
            colors={[theme.primary, theme.accent, theme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill]}
          />

          {/* Shine overlay */}
          <Animated.View
            style={[
              styles.shine,
              shinePositionStyle,
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill]}
            />
          </Animated.View>

          {/* Glow effect (iOS only) */}
          {Platform.OS === 'ios' && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  shadowColor: theme.glow,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                },
              ]}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  track: {
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
  },
});
