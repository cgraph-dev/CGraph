/**
 * Heatmap - Activity Heatmap with Color Intensity
 *
 * Features:
 * - GitHub-style contribution graph
 * - Customizable color scales
 * - Animated cell reveals
 * - Tooltip support
 * - Flexible date ranges
 * - Legend with intensity levels
 */

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import chroma from 'chroma-js';

import { SPRING_PRESETS } from '../../lib/animations/AnimationLibrary';

// ============================================================================
// Types
// ============================================================================

export interface HeatmapData {
  date: Date | string;
  value: number;
  label?: string;
}

export interface HeatmapProps {
  data: HeatmapData[];
  startDate?: Date;
  endDate?: Date;
  cellSize?: number;
  cellGap?: number;
  cellRadius?: number;
  colorScale?: string[];
  emptyColor?: string;
  showWeekdayLabels?: boolean;
  showMonthLabels?: boolean;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom';
  animated?: boolean;
  animationStagger?: number;
  onCellPress?: (data: HeatmapData) => void;
  style?: StyleProp<ViewStyle>;
}

// ============================================================================
// Constants
// ============================================================================

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_COLOR_SCALE = [
  '#161b22', // Level 0 - empty/no contribution
  '#0e4429', // Level 1 - low
  '#006d32', // Level 2 - medium-low
  '#26a641', // Level 3 - medium-high
  '#39d353', // Level 4 - high
];

// ============================================================================
// Component
// ============================================================================

export function Heatmap({
  data,
  startDate: propStartDate,
  endDate: propEndDate,
  cellSize = 12,
  cellGap = 3,
  cellRadius = 2,
  colorScale = DEFAULT_COLOR_SCALE,
  emptyColor = '#161b22',
  showWeekdayLabels = true,
  showMonthLabels = true,
  showLegend = true,
  legendPosition = 'bottom',
  animated = true,
  animationStagger = 5,
  onCellPress,
  style,
}: HeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<HeatmapData | null>(null);

  // Calculate date range
  const { startDate, endDate, weeks } = useMemo(() => {
    const end = propEndDate || new Date();
    const start = propStartDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Adjust start to beginning of week (Sunday)
    const adjustedStart = new Date(start);
    adjustedStart.setDate(adjustedStart.getDate() - adjustedStart.getDay());

    // Adjust end to end of week (Saturday)
    const adjustedEnd = new Date(end);
    adjustedEnd.setDate(adjustedEnd.getDate() + (6 - adjustedEnd.getDay()));

    // Calculate number of weeks
    const weekCount = Math.ceil(
      (adjustedEnd.getTime() - adjustedStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    return {
      startDate: adjustedStart,
      endDate: adjustedEnd,
      weeks: weekCount,
    };
  }, [propStartDate, propEndDate]);

  // Create data map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapData>();
    data.forEach((item) => {
      const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
      const key = date.toISOString().split('T')[0];
      map.set(key!, item);
    });
    return map;
  }, [data]);

  // Calculate min/max values for color interpolation
  const { minValue, maxValue } = useMemo(() => {
    const values = data.map((d) => d.value).filter((v) => v > 0);
    return {
      minValue: values.length > 0 ? Math.min(...values) : 0,
      maxValue: values.length > 0 ? Math.max(...values) : 1,
    };
  }, [data]);

  // Create color interpolator
  const getColor = useCallback(
    (value: number) => {
      if (value <= 0) return emptyColor;

      const normalizedValue = (value - minValue) / (maxValue - minValue || 1);
      const index = Math.min(
        Math.floor(normalizedValue * (colorScale.length - 1)) + 1,
        colorScale.length - 1
      );
      return colorScale[index];
    },
    [minValue, maxValue, colorScale, emptyColor]
  );

  // Generate cells
  const cells = useMemo(() => {
    const result: Array<{
      date: Date;
      value: number;
      color: string;
      weekIndex: number;
      dayIndex: number;
      data?: HeatmapData;
    }> = [];

    const currentDate = new Date(startDate);

    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < 7; day++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const cellData = dataMap.get(dateKey!);
        const value = cellData?.value || 0;

        result.push({
          date: new Date(currentDate),
          value,
          color: getColor(value),
          weekIndex: week,
          dayIndex: day,
          data: cellData,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return result;
  }, [startDate, weeks, dataMap, getColor]);

  // Generate month labels
  const monthLabels = useMemo(() => {
    if (!showMonthLabels) return [];

    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;

    cells.forEach((cell) => {
      const month = cell.date.getMonth();
      if (month !== lastMonth && cell.dayIndex === 0) {
        labels.push({
          month: MONTHS[month]!,
          weekIndex: cell.weekIndex,
        });
        lastMonth = month;
      }
    });

    return labels;
  }, [cells, showMonthLabels]);

  // Handle cell press
  const handleCellPress = useCallback(
    (cellData: HeatmapData | undefined) => {
      if (cellData) {
        setSelectedCell(cellData);
        onCellPress?.(cellData);
      }
    },
    [onCellPress]
  );

  // Calculate dimensions
  const gridWidth = weeks * (cellSize + cellGap);
  const gridHeight = 7 * (cellSize + cellGap);
  const labelWidth = showWeekdayLabels ? 30 : 0;
  const labelHeight = showMonthLabels ? 20 : 0;

  return (
    <View style={[styles.container, style]}>
      {/* Legend at top */}
      {showLegend && legendPosition === 'top' && (
        <HeatmapLegend colorScale={colorScale} cellSize={cellSize} cellRadius={cellRadius} />
      )}

      <View style={styles.gridContainer}>
        {/* Month labels */}
        {showMonthLabels && (
          <View style={[styles.monthLabels, { marginLeft: labelWidth, height: labelHeight }]}>
            {monthLabels.map((label, index) => (
              <Animated.Text
                key={`month-${index}`}
                style={[
                  styles.monthLabel,
                  { left: label.weekIndex * (cellSize + cellGap) },
                ]}
              >
                {label.month}
              </Animated.Text>
            ))}
          </View>
        )}

        <View style={styles.gridRow}>
          {/* Weekday labels */}
          {showWeekdayLabels && (
            <View style={[styles.weekdayLabels, { width: labelWidth }]}>
              {[1, 3, 5].map((day) => (
                <Animated.Text
                  key={`weekday-${day}`}
                  style={[
                    styles.weekdayLabel,
                    { top: day * (cellSize + cellGap) + cellSize / 4 },
                  ]}
                >
                  {WEEKDAYS[day]}
                </Animated.Text>
              ))}
            </View>
          )}

          {/* Grid */}
          <View style={[styles.grid, { width: gridWidth, height: gridHeight }]}>
            {cells.map((cell, index) => (
              <HeatmapCell
                key={`cell-${index}`}
                cell={cell}
                cellSize={cellSize}
                cellGap={cellGap}
                cellRadius={cellRadius}
                animated={animated}
                animationDelay={animated ? index * animationStagger : 0}
                onPress={() => handleCellPress(cell.data)}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Selected cell tooltip */}
      {selectedCell && (
        <View style={styles.tooltip}>
          <Animated.Text style={styles.tooltipText}>
            {typeof selectedCell.date === 'string'
              ? selectedCell.date
              : selectedCell.date.toLocaleDateString()}
            : {selectedCell.value} {selectedCell.label || 'contributions'}
          </Animated.Text>
        </View>
      )}

      {/* Legend at bottom */}
      {showLegend && legendPosition === 'bottom' && (
        <HeatmapLegend colorScale={colorScale} cellSize={cellSize} cellRadius={cellRadius} />
      )}
    </View>
  );
}

// ============================================================================
// Heatmap Cell Component
// ============================================================================

interface HeatmapCellProps {
  cell: {
    date: Date;
    value: number;
    color: string;
    weekIndex: number;
    dayIndex: number;
  };
  cellSize: number;
  cellGap: number;
  cellRadius: number;
  animated: boolean;
  animationDelay: number;
  onPress: () => void;
}

function HeatmapCell({
  cell,
  cellSize,
  cellGap,
  cellRadius,
  animated,
  animationDelay,
  onPress,
}: HeatmapCellProps) {
  const opacity = useSharedValue(animated ? 0 : 1);
  const scale = useSharedValue(animated ? 0.5 : 1);

  useEffect(() => {
    if (animated) {
      opacity.value = withDelay(
        animationDelay,
        withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) })
      );
      scale.value = withDelay(
        animationDelay,
        withSpring(1, SPRING_PRESETS.bouncy)
      );
    }
  }, [animated, animationDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const left = cell.weekIndex * (cellSize + cellGap);
  const top = cell.dayIndex * (cellSize + cellGap);

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.cell,
          {
            position: 'absolute',
            left,
            top,
            width: cellSize,
            height: cellSize,
            borderRadius: cellRadius,
            backgroundColor: cell.color,
          },
          animatedStyle,
        ]}
      />
    </Pressable>
  );
}

// ============================================================================
// Legend Component
// ============================================================================

interface HeatmapLegendProps {
  colorScale: string[];
  cellSize: number;
  cellRadius: number;
}

function HeatmapLegend({ colorScale, cellSize, cellRadius }: HeatmapLegendProps) {
  return (
    <View style={styles.legend}>
      <Animated.Text style={styles.legendLabel}>Less</Animated.Text>
      {colorScale.map((color, index) => (
        <View
          key={`legend-${index}`}
          style={[
            styles.legendCell,
            {
              width: cellSize,
              height: cellSize,
              borderRadius: cellRadius,
              backgroundColor: color,
            },
          ]}
        />
      ))}
      <Animated.Text style={styles.legendLabel}>More</Animated.Text>
    </View>
  );
}

// ============================================================================
// Calendar Heatmap Variant
// ============================================================================

export interface CalendarHeatmapProps {
  data: HeatmapData[];
  year?: number;
  cellSize?: number;
  colorScale?: string[];
  onCellPress?: (data: HeatmapData) => void;
  style?: StyleProp<ViewStyle>;
}

export function CalendarHeatmap({
  data,
  year = new Date().getFullYear(),
  cellSize = 14,
  colorScale = DEFAULT_COLOR_SCALE,
  onCellPress,
  style,
}: CalendarHeatmapProps) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  return (
    <Heatmap
      data={data}
      startDate={startDate}
      endDate={endDate}
      cellSize={cellSize}
      colorScale={colorScale}
      onCellPress={onCellPress}
      style={style}
    />
  );
}

// ============================================================================
// Matrix Heatmap (for 2D data)
// ============================================================================

export interface MatrixHeatmapProps {
  data: number[][];
  rowLabels?: string[];
  columnLabels?: string[];
  cellSize?: number;
  cellGap?: number;
  colorScale?: string[];
  showValues?: boolean;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MatrixHeatmap({
  data,
  rowLabels,
  columnLabels,
  cellSize = 40,
  cellGap = 2,
  colorScale = ['#1e3a5f', '#2563eb', '#60a5fa', '#93c5fd', '#dbeafe'],
  showValues = true,
  animated = true,
  style,
}: MatrixHeatmapProps) {
  // Calculate min/max
  const { minValue, maxValue } = useMemo(() => {
    const flat = data.flat();
    return {
      minValue: Math.min(...flat),
      maxValue: Math.max(...flat),
    };
  }, [data]);

  // Color interpolator
  const getColor = useCallback(
    (value: number) => {
      const normalized = (value - minValue) / (maxValue - minValue || 1);
      const index = Math.min(
        Math.floor(normalized * (colorScale.length - 1)),
        colorScale.length - 1
      );
      return colorScale[index];
    },
    [minValue, maxValue, colorScale]
  );

  const rows = data.length;
  const cols = data[0]?.length || 0;
  const labelWidth = rowLabels ? 60 : 0;
  const labelHeight = columnLabels ? 20 : 0;

  return (
    <View style={[styles.matrixContainer, style]}>
      {/* Column labels */}
      {columnLabels && (
        <View style={[styles.columnLabels, { marginLeft: labelWidth }]}>
          {columnLabels.map((label, index) => (
            <Animated.Text
              key={`col-${index}`}
              style={[styles.matrixLabel, { width: cellSize + cellGap }]}
            >
              {label}
            </Animated.Text>
          ))}
        </View>
      )}

      <View style={styles.matrixRow}>
        {/* Row labels */}
        {rowLabels && (
          <View style={[styles.rowLabels, { width: labelWidth }]}>
            {rowLabels.map((label, index) => (
              <Animated.Text
                key={`row-${index}`}
                style={[styles.matrixLabel, { height: cellSize + cellGap }]}
              >
                {label}
              </Animated.Text>
            ))}
          </View>
        )}

        {/* Matrix cells */}
        <View style={styles.matrixGrid}>
          {data.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.matrixGridRow}>
              {row.map((value, colIndex) => {
                const opacity = useSharedValue(animated ? 0 : 1);

                useEffect(() => {
                  if (animated) {
                    opacity.value = withDelay(
                      (rowIndex * cols + colIndex) * 20,
                      withTiming(1, { duration: 300 })
                    );
                  }
                }, [animated]);

                const animatedCellStyle = useAnimatedStyle(() => ({
                  opacity: opacity.value,
                }));

                return (
                  <Animated.View
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={[
                      styles.matrixCell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getColor(value),
                        margin: cellGap / 2,
                      },
                      animatedCellStyle,
                    ]}
                  >
                    {showValues && (
                      <Animated.Text style={styles.matrixValue}>
                        {value.toFixed(1)}
                      </Animated.Text>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  gridContainer: {},
  monthLabels: {
    position: 'relative',
  },
  monthLabel: {
    position: 'absolute',
    color: '#9ca3af',
    fontSize: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  weekdayLabels: {
    position: 'relative',
  },
  weekdayLabel: {
    position: 'absolute',
    color: '#9ca3af',
    fontSize: 10,
    right: 4,
  },
  grid: {
    position: 'relative',
  },
  cell: {},
  tooltip: {
    marginTop: 12,
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tooltipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  legendLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginHorizontal: 4,
  },
  legendCell: {},
  matrixContainer: {},
  columnLabels: {
    flexDirection: 'row',
  },
  rowLabels: {},
  matrixRow: {
    flexDirection: 'row',
  },
  matrixLabel: {
    color: '#9ca3af',
    fontSize: 10,
    textAlign: 'center',
    justifyContent: 'center',
  },
  matrixGrid: {},
  matrixGridRow: {
    flexDirection: 'row',
  },
  matrixCell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  matrixValue: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default Heatmap;
