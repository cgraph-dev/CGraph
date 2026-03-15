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
import React, { useMemo, useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { HeatmapCell } from './heatmap/components/heatmap-cell';
import { HeatmapLegend } from './heatmap/components/heatmap-legend';
import { HeatmapTooltip } from './heatmap/components/heatmap-tooltip';
import { WEEKDAYS, MONTHS, DEFAULT_COLOR_SCALE } from './heatmap/constants';
import { styles } from './heatmap/styles';

// Re-export types and sub-components for consumers
export type {
  HeatmapData,
  HeatmapProps,
  CalendarHeatmapProps,
  MatrixHeatmapProps,
} from './heatmap/types';
export { CalendarHeatmap } from './heatmap/calendar-heatmap';
export { MatrixHeatmap } from './heatmap/matrix-heatmap';

import type { HeatmapData, HeatmapProps } from './heatmap/types';

/**
 * Heatmap component.
 *
 */
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

  const { startDate, endDate, weeks } = useMemo(() => {
    const end = propEndDate || new Date();
    const start = propStartDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    const adjustedStart = new Date(start);
    adjustedStart.setDate(adjustedStart.getDate() - adjustedStart.getDay());
    const adjustedEnd = new Date(end);
    adjustedEnd.setDate(adjustedEnd.getDate() + (6 - adjustedEnd.getDay()));
    const weekCount = Math.ceil(
      (adjustedEnd.getTime() - adjustedStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return { startDate: adjustedStart, endDate: adjustedEnd, weeks: weekCount };
  }, [propStartDate, propEndDate]);

  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapData>();
    data.forEach((item) => {
      const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
      const key = date.toISOString().split('T')[0];
      map.set(key!, item);
    });
    return map;
  }, [data]);

  const { minValue, maxValue } = useMemo(() => {
    const values = data.map((d) => d.value).filter((v) => v > 0);
    return {
      minValue: values.length > 0 ? Math.min(...values) : 0,
      maxValue: values.length > 0 ? Math.max(...values) : 1,
    };
  }, [data]);

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

  const monthLabels = useMemo(() => {
    if (!showMonthLabels) return [];
    const labels: Array<{ month: string; weekIndex: number }> = [];
    let lastMonth = -1;
    cells.forEach((cell) => {
      const month = cell.date.getMonth();
      if (month !== lastMonth && cell.dayIndex === 0) {
        labels.push({ month: MONTHS[month]!, weekIndex: cell.weekIndex });
        lastMonth = month;
      }
    });
    return labels;
  }, [cells, showMonthLabels]);

  const handleCellPress = useCallback(
    (cellData: HeatmapData | undefined) => {
      if (cellData) {
        setSelectedCell(cellData);
        onCellPress?.(cellData);
      }
    },
    [onCellPress]
  );

  const gridWidth = weeks * (cellSize + cellGap);
  const gridHeight = 7 * (cellSize + cellGap);
  const labelWidth = showWeekdayLabels ? 30 : 0;
  const labelHeight = showMonthLabels ? 20 : 0;

  return (
    <View style={[styles.container, style]}>
      {showLegend && legendPosition === 'top' && (
        <HeatmapLegend colorScale={colorScale} cellSize={cellSize} cellRadius={cellRadius} />
      )}

      <View style={styles.gridContainer}>
        {showMonthLabels && (
          <View style={[styles.monthLabels, { marginLeft: labelWidth, height: labelHeight }]}>
            {monthLabels.map((label, index) => (
              <Animated.Text
                key={`month-${index}`}
                style={[styles.monthLabel, { left: label.weekIndex * (cellSize + cellGap) }]}
              >
                {label.month}
              </Animated.Text>
            ))}
          </View>
        )}

        <View style={styles.gridRow}>
          {showWeekdayLabels && (
            <View style={[styles.weekdayLabels, { width: labelWidth }]}>
              {[1, 3, 5].map((day) => (
                <Animated.Text
                  key={`weekday-${day}`}
                  style={[styles.weekdayLabel, { top: day * (cellSize + cellGap) + cellSize / 4 }]}
                >
                  {WEEKDAYS[day]}
                </Animated.Text>
              ))}
            </View>
          )}

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

      <HeatmapTooltip selectedCell={selectedCell} />

      {showLegend && legendPosition === 'bottom' && (
        <HeatmapLegend colorScale={colorScale} cellSize={cellSize} cellRadius={cellRadius} />
      )}
    </View>
  );
}

export default Heatmap;
