/**
 * Types for the heatmap visualization components.
 * @module components/visualization/heatmap/types
 */
import { StyleProp, ViewStyle } from 'react-native';

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

export interface CalendarHeatmapProps {
  data: HeatmapData[];
  year?: number;
  cellSize?: number;
  colorScale?: string[];
  onCellPress?: (data: HeatmapData) => void;
  style?: StyleProp<ViewStyle>;
}

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

export interface HeatmapCellData {
  date: Date;
  value: number;
  color: string;
  weekIndex: number;
  dayIndex: number;
  data?: HeatmapData;
}
