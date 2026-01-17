/**
 * AnimatedChart - Animated Chart Components
 *
 * Features:
 * - Line, bar, and pie charts
 * - Smooth enter animations
 * - Interactive touch points
 * - Gradient fills
 * - Axis labels and grid
 * - Responsive sizing
 */

import React, { useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

import { SPRING_PRESETS } from '../../lib/animations/AnimationLibrary';

// ============================================================================
// Types
// ============================================================================

export interface DataPoint {
  value: number;
  label?: string;
  color?: string;
}

export interface ChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  gradientColors?: [string, string];
  showGrid?: boolean;
  showLabels?: boolean;
  showPoints?: boolean;
  animated?: boolean;
  animationDuration?: number;
  animationDelay?: number;
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Animated Components
// ============================================================================

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ============================================================================
// Line Chart
// ============================================================================

export interface LineChartProps extends ChartProps {
  curved?: boolean;
  strokeWidth?: number;
  showArea?: boolean;
}

export function LineChart({
  data,
  width: propWidth,
  height = 200,
  color = '#10b981',
  gradientColors,
  showGrid = true,
  showLabels = true,
  showPoints = true,
  curved = true,
  strokeWidth = 2,
  showArea = true,
  animated = true,
  animationDuration = 1000,
  animationDelay = 0,
  style,
}: LineChartProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const width = propWidth || screenWidth - 32;

  const progress = useSharedValue(0);

  // Margins
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate scales
  const { minValue, maxValue, xScale, yScale } = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 1;

    return {
      minValue: min - padding,
      maxValue: max + padding,
      xScale: (index: number) => (index / (data.length - 1)) * chartWidth,
      yScale: (value: number) =>
        chartHeight - ((value - (min - padding)) / ((max + padding) - (min - padding))) * chartHeight,
    };
  }, [data, chartWidth, chartHeight]);

  // Generate path
  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '' };

    let line = '';
    let area = '';

    data.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);

      if (index === 0) {
        line = `M ${x} ${y}`;
        area = `M ${x} ${chartHeight} L ${x} ${y}`;
      } else if (curved) {
        const prevX = xScale(index - 1);
        const prevY = yScale(data[index - 1]!.value);
        const cpx = (prevX + x) / 2;
        line += ` C ${cpx} ${prevY}, ${cpx} ${y}, ${x} ${y}`;
        area += ` C ${cpx} ${prevY}, ${cpx} ${y}, ${x} ${y}`;
      } else {
        line += ` L ${x} ${y}`;
        area += ` L ${x} ${y}`;
      }
    });

    area += ` L ${xScale(data.length - 1)} ${chartHeight} Z`;

    return { linePath: line, areaPath: area };
  }, [data, xScale, yScale, chartHeight, curved]);

  // Animation
  useEffect(() => {
    if (animated) {
      progress.value = withDelay(
        animationDelay,
        withTiming(1, { duration: animationDuration, easing: Easing.out(Easing.cubic) })
      );
    } else {
      progress.value = 1;
    }
  }, [animated, animationDuration, animationDelay]);

  // Animated line props
  const animatedLineProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(progress.value, [0, 1], [1000, 0]),
  }));

  // Animated area props
  const animatedAreaProps = useAnimatedProps(() => ({
    opacity: progress.value,
  }));

  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const ySteps = 5;

    for (let i = 0; i <= ySteps; i++) {
      const y = (i / ySteps) * chartHeight;
      const value = maxValue - (i / ySteps) * (maxValue - minValue);

      lines.push(
        <G key={`grid-${i}`}>
          <Line
            x1={0}
            y1={y}
            x2={chartWidth}
            y2={y}
            stroke="#374151"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          {showLabels && (
            <SvgText
              x={-8}
              y={y + 4}
              fill="#9ca3af"
              fontSize={10}
              textAnchor="end"
            >
              {value.toFixed(0)}
            </SvgText>
          )}
        </G>
      );
    }

    return lines;
  }, [chartHeight, chartWidth, maxValue, minValue, showLabels]);

  // Data points
  const points = useMemo(() => {
    if (!showPoints) return null;

    return data.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);

      return (
        <AnimatedCircle
          key={`point-${index}`}
          cx={x}
          cy={y}
          r={4}
          fill={color}
          stroke="#ffffff"
          strokeWidth={2}
          animatedProps={useAnimatedProps(() => ({
            opacity: progress.value,
          }))}
        />
      );
    });
  }, [data, xScale, yScale, color, showPoints]);

  // X-axis labels
  const xLabels = useMemo(() => {
    if (!showLabels) return null;

    return data
      .filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1)
      .map((point, index, arr) => {
        const originalIndex = data.indexOf(point);
        const x = xScale(originalIndex);

        return (
          <SvgText
            key={`xlabel-${index}`}
            x={x}
            y={chartHeight + 20}
            fill="#9ca3af"
            fontSize={10}
            textAnchor="middle"
          >
            {point.label || `${originalIndex + 1}`}
          </SvgText>
        );
      });
  }, [data, xScale, chartHeight, showLabels]);

  const gradientId = `lineGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors?.[0] || color} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={gradientColors?.[1] || color} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <G transform={`translate(${margin.left}, ${margin.top})`}>
          {showGrid && gridLines}

          {showArea && (
            <AnimatedPath
              d={areaPath}
              fill={`url(#${gradientId})`}
              animatedProps={animatedAreaProps}
            />
          )}

          <AnimatedPath
            d={linePath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={1000}
            animatedProps={animatedLineProps}
          />

          {points}
          {xLabels}
        </G>
      </Svg>
    </View>
  );
}

// ============================================================================
// Bar Chart
// ============================================================================

export interface BarChartProps extends ChartProps {
  barWidth?: number;
  barSpacing?: number;
  horizontal?: boolean;
}

export function BarChart({
  data,
  width: propWidth,
  height = 200,
  color = '#10b981',
  gradientColors,
  showGrid = true,
  showLabels = true,
  barWidth,
  barSpacing = 8,
  horizontal = false,
  animated = true,
  animationDuration = 800,
  animationDelay = 0,
  style,
}: BarChartProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const width = propWidth || screenWidth - 32;

  const progress = useSharedValue(0);

  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate bar dimensions
  const calculatedBarWidth = barWidth || (chartWidth - (data.length - 1) * barSpacing) / data.length;

  // Calculate scale
  const { maxValue, yScale } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value));
    const paddedMax = max * 1.1;

    return {
      maxValue: paddedMax,
      yScale: (value: number) => (value / paddedMax) * chartHeight,
    };
  }, [data, chartHeight]);

  // Animation
  useEffect(() => {
    if (animated) {
      progress.value = withDelay(
        animationDelay,
        withTiming(1, { duration: animationDuration, easing: Easing.out(Easing.cubic) })
      );
    } else {
      progress.value = 1;
    }
  }, [animated, animationDuration, animationDelay]);

  const gradientId = `barGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors?.[0] || color} stopOpacity={1} />
            <Stop offset="100%" stopColor={gradientColors?.[1] || color} stopOpacity={0.6} />
          </LinearGradient>
        </Defs>

        <G transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid */}
          {showGrid &&
            [0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = chartHeight - ratio * chartHeight;
              const value = ratio * maxValue;

              return (
                <G key={`grid-${i}`}>
                  <Line
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#374151"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                  {showLabels && (
                    <SvgText
                      x={-8}
                      y={y + 4}
                      fill="#9ca3af"
                      fontSize={10}
                      textAnchor="end"
                    >
                      {value.toFixed(0)}
                    </SvgText>
                  )}
                </G>
              );
            })}

          {/* Bars */}
          {data.map((point, index) => {
            const x = index * (calculatedBarWidth + barSpacing);
            const barHeight = yScale(point.value);
            const y = chartHeight - barHeight;

            return (
              <G key={`bar-${index}`}>
                <AnimatedRect
                  x={x}
                  y={y}
                  width={calculatedBarWidth}
                  height={barHeight}
                  rx={4}
                  fill={point.color || `url(#${gradientId})`}
                  animatedProps={useAnimatedProps(() => ({
                    height: barHeight * progress.value,
                    y: chartHeight - barHeight * progress.value,
                  }))}
                />

                {showLabels && (
                  <SvgText
                    x={x + calculatedBarWidth / 2}
                    y={chartHeight + 16}
                    fill="#9ca3af"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {point.label || `${index + 1}`}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

// ============================================================================
// Pie Chart
// ============================================================================

export interface PieChartProps {
  data: DataPoint[];
  size?: number;
  innerRadius?: number;
  showLabels?: boolean;
  animated?: boolean;
  animationDuration?: number;
  colors?: string[];
  style?: StyleProp<ViewStyle>;
}

export function PieChart({
  data,
  size = 200,
  innerRadius = 0,
  showLabels = true,
  animated = true,
  animationDuration = 1000,
  colors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'],
  style,
}: PieChartProps) {
  const progress = useSharedValue(0);
  const radius = size / 2 - 10;
  const center = size / 2;

  // Calculate slices
  const slices = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90; // Start from top

    return data.map((point, index) => {
      const angle = (point.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      let path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      if (innerRadius > 0) {
        const innerX1 = center + innerRadius * Math.cos(startRad);
        const innerY1 = center + innerRadius * Math.sin(startRad);
        const innerX2 = center + innerRadius * Math.cos(endRad);
        const innerY2 = center + innerRadius * Math.sin(endRad);

        path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${innerX2} ${innerY2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1} Z`;
      }

      return {
        path,
        color: point.color || colors[index % colors.length],
        label: point.label,
        percentage: ((point.value / total) * 100).toFixed(1),
        midAngle: (startAngle + endAngle) / 2,
      };
    });
  }, [data, radius, center, innerRadius, colors]);

  // Animation
  useEffect(() => {
    if (animated) {
      progress.value = withTiming(1, { duration: animationDuration, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = 1;
    }
  }, [animated, animationDuration]);

  return (
    <View style={[styles.pieContainer, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {slices.map((slice, index) => (
          <AnimatedPath
            key={`slice-${index}`}
            d={slice.path}
            fill={slice.color}
            animatedProps={useAnimatedProps(() => ({
              opacity: progress.value,
              transform: [
                { scale: interpolate(progress.value, [0, 1], [0.5, 1]) },
              ],
            }))}
          />
        ))}
      </Svg>

      {showLabels && (
        <View style={styles.pieLegend}>
          {slices.map((slice, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
              <Animated.Text style={styles.legendText}>
                {slice.label || `Item ${index + 1}`} ({slice.percentage}%)
              </Animated.Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  pieContainer: {
    alignItems: 'center',
  },
  pieLegend: {
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
  legendText: {
    color: '#9ca3af',
    fontSize: 12,
  },
});

export default { LineChart, BarChart, PieChart };
