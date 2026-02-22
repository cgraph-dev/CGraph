/**
 * ProgressRing - Circular Progress Indicator with Animations
 *
 * Features:
 * - Smooth progress animations
 * - Gradient fills
 * - Multiple ring styles
 * - Inner content support
 * - Stacked rings
 * - Animated value counter
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useDerivedValue,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

import { SPRING_PRESETS, getSpringConfig } from '../../lib/animations/animation-library';

// ============================================================================
// Types
// ============================================================================

export interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  gradientColors?: [string, string];
  backgroundColor?: string;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  animated?: boolean;
  animationDuration?: number;
  springPreset?: keyof typeof SPRING_PRESETS;
  lineCap?: 'butt' | 'round' | 'square';
  rotation?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// ============================================================================
// Animated Components
// ============================================================================

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ============================================================================
// Component
// ============================================================================

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = '#10b981',
  gradientColors,
  backgroundColor = '#374151',
  showValue = true,
  valuePrefix = '',
  valueSuffix = '%',
  animated = true,
  animationDuration = 1000,
  springPreset = 'bouncy',
  lineCap = 'round',
  rotation = -90,
  style,
  children,
}: ProgressRingProps) {
  const animatedProgress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const springConfig = getSpringConfig(SPRING_PRESETS[springPreset]);

  // Clamp progress
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Animate progress
  useEffect(() => {
    if (animated) {
      animatedProgress.value = withSpring(clampedProgress, springConfig);
    } else {
      animatedProgress.value = clampedProgress;
    }
  }, [clampedProgress, animated, springConfig]);

  // Animated circle props
  const animatedProps = useAnimatedProps(() => {
    const offset = circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset: offset,
    };
  });

  // Animated value for display
  const displayValue = useDerivedValue(() => {
    return Math.round(animatedProgress.value);
  });

  const gradientId = `progressGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          {gradientColors && (
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          )}
        </Defs>

        <G rotation={rotation} origin={`${center}, ${center}`}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={gradientColors ? `url(#${gradientId})` : color}
            strokeWidth={strokeWidth}
            strokeLinecap={lineCap}
            strokeDasharray={circumference}
            fill="none"
            animatedProps={animatedProps}
          />
        </G>
      </Svg>

      {/* Inner content */}
      <View style={styles.innerContent}>
        {children ||
          (showValue && (
            <AnimatedProgressValue
              value={displayValue}
              prefix={valuePrefix}
              suffix={valueSuffix}
              color={color}
            />
          ))}
      </View>
    </View>
  );
}

// ============================================================================
// Animated Value Display
// ============================================================================

interface AnimatedProgressValueProps {
  value: SharedValue<number>;
  prefix?: string;
  suffix?: string;
  color: string;
}

function AnimatedProgressValue({ value, prefix, suffix, color }: AnimatedProgressValueProps) {
  const animatedStyle = useAnimatedProps(() => {
    return {
      text: `${prefix}${Math.round(value.value)}${suffix}`,
    };
  });

  return (
    <Animated.Text style={[styles.valueText, { color }]} animatedProps={animatedStyle as unknown}>
      {prefix}
      {Math.round(value.value)}
      {suffix}
    </Animated.Text>
  );
}

// ============================================================================
// Stacked Progress Ring
// ============================================================================

export interface StackedProgressRingProps {
  rings: Array<{
    progress: number;
    color: string;
    label?: string;
  }>;
  size?: number;
  strokeWidth?: number;
  spacing?: number;
  animated?: boolean;
  showLegend?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StackedProgressRing({
  rings,
  size = 160,
  strokeWidth = 8,
  spacing = 4,
  animated = true,
  showLegend = true,
  style,
}: StackedProgressRingProps) {
  return (
    <View style={[styles.stackedContainer, style]}>
      <View style={[styles.stackedRings, { width: size, height: size }]}>
        {rings.map((ring, index) => {
          const ringSize = size - index * (strokeWidth + spacing) * 2;
          const offset = (size - ringSize) / 2;

          return (
            <View
              key={`ring-${index}`}
              style={[
                styles.stackedRing,
                {
                  position: 'absolute',
                  top: offset,
                  left: offset,
                },
              ]}
            >
              <ProgressRing
                progress={ring.progress}
                size={ringSize}
                strokeWidth={strokeWidth}
                color={ring.color}
                animated={animated}
                showValue={false}
              />
            </View>
          );
        })}
      </View>

      {showLegend && (
        <View style={styles.stackedLegend}>
          {rings.map((ring, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: ring.color }]} />
              <Animated.Text style={styles.legendLabel}>
                {ring.label || `Ring ${index + 1}`}
              </Animated.Text>
              <Animated.Text style={[styles.legendValue, { color: ring.color }]}>
                {ring.progress}%
              </Animated.Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Gauge Ring
// ============================================================================

export interface GaugeRingProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  gradientColors?: [string, string];
  showTicks?: boolean;
  tickCount?: number;
  label?: string;
  unit?: string;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GaugeRing({
  value,
  min = 0,
  max = 100,
  size = 180,
  strokeWidth = 12,
  color = '#10b981',
  gradientColors,
  showTicks = true,
  tickCount = 10,
  label,
  unit = '',
  animated = true,
  style,
}: GaugeRingProps) {
  const animatedValue = useSharedValue(min);
  const clampedValue = Math.min(max, Math.max(min, value));
  const progress = ((clampedValue - min) / (max - min)) * 100;

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  useEffect(() => {
    if (animated) {
      animatedValue.value = withSpring(clampedValue, SPRING_PRESETS.bouncy);
    } else {
      animatedValue.value = clampedValue;
    }
  }, [clampedValue, animated]);

  // Generate tick marks
  const ticks = useMemo(() => {
    if (!showTicks) return null;

    const tickMarks = [];
    const arcAngle = 240; // Gauge arc angle
    const startAngle = 150; // Start from bottom-left

    for (let i = 0; i <= tickCount; i++) {
      const angle = startAngle + (i / tickCount) * arcAngle;
      const rad = (angle * Math.PI) / 180;

      const innerRadius = radius - strokeWidth / 2 - 5;
      const outerRadius = radius - strokeWidth / 2 - 15;

      const x1 = center + innerRadius * Math.cos(rad);
      const y1 = center + innerRadius * Math.sin(rad);
      const x2 = center + outerRadius * Math.cos(rad);
      const y2 = center + outerRadius * Math.sin(rad);

      tickMarks.push(
        <View
          key={`tick-${i}`}
          style={[
            styles.tick,
            {
              position: 'absolute',
              left: x1 - 1,
              top: y1 - 8,
              width: 2,
              height: 16,
              backgroundColor: '#6b7280',
              transform: [{ rotate: `${angle + 90}deg` }],
            },
          ]}
        />
      );
    }

    return tickMarks;
  }, [showTicks, tickCount, radius, center, strokeWidth]);

  return (
    <View style={[styles.gaugeContainer, { width: size, height: size }, style]}>
      <ProgressRing
        progress={(progress * 240) / 360} // Convert to partial ring
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        gradientColors={gradientColors}
        rotation={150}
        lineCap="round"
        showValue={false}
        animated={animated}
      />

      {ticks}

      <View style={styles.gaugeContent}>
        <Animated.Text style={[styles.gaugeValue, { color }]}>
          {Math.round(clampedValue)}
          {unit}
        </Animated.Text>
        {label && <Animated.Text style={styles.gaugeLabel}>{label}</Animated.Text>}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
  },
  stackedContainer: {
    alignItems: 'center',
  },
  stackedRings: {
    position: 'relative',
  },
  stackedRing: {},
  stackedLegend: {
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    flex: 1,
    color: '#9ca3af',
    fontSize: 12,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  gaugeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gaugeContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  gaugeLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  tick: {},
});

export default ProgressRing;
