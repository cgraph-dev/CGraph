import React, { useMemo, useRef, useEffect } from 'react';
import { View, ViewStyle, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// =============================================================================
// CORNER DECORATION
// =============================================================================

interface CornerDecorationProps {
  color: string;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export function CornerDecoration({ color, position }: CornerDecorationProps) {
  const rotation = {
    topLeft: '0deg',
    topRight: '90deg',
    bottomLeft: '-90deg',
    bottomRight: '180deg',
  };

  const positionStyle: ViewStyle = {
    topLeft: { top: 0, left: 0 },
    topRight: { top: 0, right: 0 },
    bottomLeft: { bottom: 0, left: 0 },
    bottomRight: { bottom: 0, right: 0 },
  }[position];

  return (
    <View
      style={[
        styles.cornerDecoration,
        positionStyle,
        { transform: [{ rotate: rotation[position] }] },
      ]}
    >
      <Svg width={24} height={24} viewBox="0 0 32 32">
        <Path d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z" fill={color} opacity={0.8} />
      </Svg>
    </View>
  );
}

// =============================================================================
// SCANLINES OVERLAY
// =============================================================================

interface ScanlinesProps {
  color?: string;
  intensity?: number | 'low' | 'medium' | 'high';
  colorTheme?: 'cyan' | 'green' | 'purple' | 'gold' | 'custom';
  animated?: boolean;
}

export function Scanlines({
  color,
  intensity = 'medium',
  colorTheme = 'cyan',
  animated = true,
}: ScanlinesProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  // Theme colors (custom falls back to cyan)
  const themeColors: Record<string, string> = {
    cyan: '#00FFFF',
    green: '#00FF88',
    purple: '#FF00FF',
    gold: '#FFD700',
    custom: '#00FFFF',
  };

  // Resolve actual color
  const actualColor = color || themeColors[colorTheme] || themeColors.cyan;

  // Resolve numeric intensity
  const intensityMap = { low: 0.3, medium: 0.5, high: 0.8 };
  const numericIntensity = typeof intensity === 'number' ? intensity : intensityMap[intensity];

  // Generate scanline rows
  const lines = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 100; i += 3) {
      rows.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            top: `${i}%`,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: actualColor,
            opacity: 0.5 * numericIntensity,
          }}
        />
      );
    }
    return rows;
  }, [actualColor, numericIntensity]);

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.timing(translateY, {
        toValue: 100,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [animated, translateY]);

  return (
    <Animated.View
      style={[
        styles.scanlinesContainer,
        {
          transform: [
            {
              translateY: translateY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 30],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {lines}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cornerDecoration: {
    position: 'absolute',
    width: 24,
    height: 24,
    zIndex: 20,
  },
  scanlinesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
});
