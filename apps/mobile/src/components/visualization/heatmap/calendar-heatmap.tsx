/**
 * Calendar Heatmap variant — year-scoped wrapper around Heatmap.
 * @module components/visualization/heatmap/calendar-heatmap
 */
import React from 'react';
import { Heatmap } from '../heatmap';
import type { CalendarHeatmapProps } from './types';
import { DEFAULT_COLOR_SCALE } from './constants';

/**
 *
 */
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
