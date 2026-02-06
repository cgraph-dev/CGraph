/**
 * Price History Chart Module
 *
 * High-performance SVG chart for displaying marketplace item price history.
 * Supports multiple time ranges, volume bars, hover tooltips,
 * and responsive container sizing.
 *
 * @module modules/gamification/components/price-history-chart
 */

// Main component
export { PriceHistoryChart, default } from './PriceHistoryChart';

// Sub-components
export { ChartHeader } from './ChartHeader';
export { ChartSVG } from './ChartSVG';
export { ChartTooltip } from './ChartTooltip';

// Hooks
export { useChartDimensions, useChartInteraction } from './hooks';

// Utilities
export { calculateMetrics, calculatePaths } from './utils';

// Types
export type {
  PricePoint,
  PriceHistoryChartProps,
  TimeRangeKey,
  ChartMetrics,
  HoveredPointData,
  ChartDimensions,
  ChartPaths,
  VolumeBar,
  ChartPadding,
} from './types';

// Constants
export { TIME_RANGES, CHART_PADDING } from './constants';
