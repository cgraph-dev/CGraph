/**
 * Visualization Components Library
 *
 * Data visualization components with animations.
 */

// Import for default export object
import { LineChart, BarChart, PieChart } from './animated-chart';
import { ProgressRing, StackedProgressRing, GaugeRing } from './progress-ring';
import { StatCounter, StatGroup, ComparisonStat, Countdown } from './stat-counter';
import { Heatmap, CalendarHeatmap, MatrixHeatmap } from './heatmap';

// ============================================================================
// Animated Charts
// ============================================================================

export { LineChart, BarChart, PieChart } from './animated-chart';

export type {
  ChartProps,
  LineChartProps,
  BarChartProps,
  PieChartProps,
  DataPoint,
} from './animated-chart';

// ============================================================================
// Progress Ring
// ============================================================================

export { ProgressRing, StackedProgressRing, GaugeRing } from './progress-ring';

export type { ProgressRingProps, StackedProgressRingProps, GaugeRingProps } from './progress-ring';

// ============================================================================
// Stat Counter
// ============================================================================

export { StatCounter, StatGroup, ComparisonStat, Countdown } from './stat-counter';

export type {
  StatCounterProps,
  StatGroupProps,
  ComparisonStatProps,
  CountdownProps,
  NumberFormat,
} from './stat-counter';

// ============================================================================
// Heatmap
// ============================================================================

export { Heatmap, CalendarHeatmap, MatrixHeatmap } from './heatmap';

export type {
  HeatmapProps,
  HeatmapData,
  CalendarHeatmapProps,
  MatrixHeatmapProps,
} from './heatmap';

// ============================================================================
// Default Export
// ============================================================================

const VisualizationComponents = {
  // Charts
  LineChart,
  BarChart,
  PieChart,

  // Progress
  ProgressRing,
  StackedProgressRing,
  GaugeRing,

  // Stats
  StatCounter,
  StatGroup,
  ComparisonStat,
  Countdown,

  // Heatmaps
  Heatmap,
  CalendarHeatmap,
  MatrixHeatmap,
};

export default VisualizationComponents;
