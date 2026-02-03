/**
 * Visualization Components Library
 *
 * Data visualization components with animations.
 */

// Import for default export object
import { LineChart, BarChart, PieChart } from './AnimatedChart';
import { ProgressRing, StackedProgressRing, GaugeRing } from './ProgressRing';
import { StatCounter, StatGroup, ComparisonStat, Countdown } from './StatCounter';
import { Heatmap, CalendarHeatmap, MatrixHeatmap } from './Heatmap';

// ============================================================================
// Animated Charts
// ============================================================================

export { LineChart, BarChart, PieChart } from './AnimatedChart';

export type {
  ChartProps,
  LineChartProps,
  BarChartProps,
  PieChartProps,
  DataPoint,
} from './AnimatedChart';

// ============================================================================
// Progress Ring
// ============================================================================

export { ProgressRing, StackedProgressRing, GaugeRing } from './ProgressRing';

export type { ProgressRingProps, StackedProgressRingProps, GaugeRingProps } from './ProgressRing';

// ============================================================================
// Stat Counter
// ============================================================================

export { StatCounter, StatGroup, ComparisonStat, Countdown } from './StatCounter';

export type {
  StatCounterProps,
  StatGroupProps,
  ComparisonStatProps,
  CountdownProps,
  NumberFormat,
} from './StatCounter';

// ============================================================================
// Heatmap
// ============================================================================

export { Heatmap, CalendarHeatmap, MatrixHeatmap } from './Heatmap';

export type {
  HeatmapProps,
  HeatmapData,
  CalendarHeatmapProps,
  MatrixHeatmapProps,
} from './Heatmap';

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
