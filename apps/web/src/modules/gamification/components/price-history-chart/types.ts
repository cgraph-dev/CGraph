/**
 * Types and interfaces for PriceHistoryChart
 */

export interface PricePoint {
  timestamp: Date;
  price: number;
  volume?: number;
}

export type TimeRangeKey = '24h' | '7d' | '30d' | '90d' | 'all';

export interface PriceHistoryChartProps {
  data: PricePoint[];
  height?: number;
  showVolume?: boolean;
  currency?: 'coins' | 'gems';
  timeRange?: TimeRangeKey;
  onTimeRangeChange?: (range: TimeRangeKey) => void;
  className?: string;
}

export interface ChartDimensions {
  width: number;
  height: number;
}

export interface HoveredPointData {
  point: PricePoint;
  x: number;
  y: number;
}

export interface ChartMetrics {
  min: number;
  max: number;
  range: number;
  latest: number;
  first: number;
  change: number;
  isPositive: boolean;
}

export interface VolumeBar {
  x: number;
  y: number;
  width: number;
  height: number;
  volume: number;
}

export interface ChartPaths {
  linePath: string;
  areaPath: string;
  volumeBars: VolumeBar[];
}

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
