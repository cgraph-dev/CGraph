/**
 * Price History Chart Module Types
 *
 * Type definitions for the marketplace price chart components.
 *
 * @module modules/gamification/components/price-history-chart
 */

/** Single price data point */
export interface PricePoint {
  /** Data point timestamp */
  timestamp: Date;
  /** Price value in currency units */
  price: number;
  /** Optional trade volume */
  volume?: number;
}

/** Time range selector options */
export type TimeRangeKey = '24h' | '7d' | '30d' | '90d' | 'all';

/** Props for the main PriceHistoryChart component */
export interface PriceHistoryChartProps {
  /** Array of price data points */
  data: PricePoint[];
  /** Chart height in pixels */
  height?: number;
  /** Whether to display volume bars */
  showVolume?: boolean;
  /** Currency display format */
  currency?: 'coins' | 'gems';
  /** Currently selected time range */
  timeRange?: TimeRangeKey;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRangeKey) => void;
  /** Additional CSS classes */
  className?: string;
}

/** Chart container dimensions */
export interface ChartDimensions {
  /** Container width in pixels */
  width: number;
  /** Container height in pixels */
  height: number;
}

/** Data for the hovered chart point */
export interface HoveredPointData {
  /** The hovered price data point */
  point: PricePoint;
  /** X coordinate on the chart */
  x: number;
  /** Y coordinate on the chart */
  y: number;
}

/** Computed chart metrics from data */
export interface ChartMetrics {
  /** Minimum price value */
  min: number;
  /** Maximum price value */
  max: number;
  /** Price range (max - min) */
  range: number;
  /** Latest price value */
  latest: number;
  /** First price value */
  first: number;
  /** Price change percentage */
  change: number;
  /** Whether the change is positive */
  isPositive: boolean;
}

/** Individual volume bar render data */
export interface VolumeBar {
  /** Bar X position */
  x: number;
  /** Bar Y position */
  y: number;
  /** Bar width */
  width: number;
  /** Bar height */
  height: number;
  /** Raw volume value */
  volume: number;
}

/** SVG path strings for the chart */
export interface ChartPaths {
  /** Line path d attribute */
  linePath: string;
  /** Area fill path d attribute */
  areaPath: string;
  /** Computed volume bars */
  volumeBars: VolumeBar[];
}

/** Chart inner padding configuration */
export interface ChartPadding {
  /** Top padding in pixels */
  top: number;
  /** Right padding in pixels */
  right: number;
  /** Bottom padding in pixels */
  bottom: number;
  /** Left padding in pixels */
  left: number;
}
