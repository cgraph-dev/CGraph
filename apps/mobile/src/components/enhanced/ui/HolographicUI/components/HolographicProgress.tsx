import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HolographicConfig, getTheme } from '../types';
import { HolographicText } from './HolographicText';

interface HolographicProgressProps {
  progress: number; // 0 to 1
  label?: string;
  showPercentage?: boolean;
  height?: number;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

export function HolographicProgress({
  progress,
  label,
  showPercentage = true,
  height = 8,
  colorTheme = 'cyan',
  style,
}: HolographicProgressProps) {
  const theme = getTheme(colorTheme);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  const clampedProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: clampedProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress]);

  useEffect(() => {
    // Shine animation loop
    const animateShine = () => {
      shineAnim.setValue(0);
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start(() => animateShine());
    };
    animateShine();

    return () => {
      shineAnim.stopAnimation();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shinePosition = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-50%', '150%'],
  });

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
        <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
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
              {
                left: shinePosition,
              },
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
