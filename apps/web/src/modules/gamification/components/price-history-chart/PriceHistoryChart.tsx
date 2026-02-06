/**
 * PriceHistoryChart Component (modularized)
 *
 * High-performance SVG chart for displaying marketplace price history.
 * Designed for scale with:
 * - Canvas fallback for large datasets (1000+ points)
 * - Virtualized rendering
 * - Responsive container
 * - Touch gestures for mobile
 * - WebGL acceleration option
 *
 * Features:
 * - Line chart with gradient fill
 * - Interactive tooltips
 * - Time range selection
 * - Price change indicators
 * - Volume overlay
 */
import type { PriceHistoryChartProps } from './types';
import {
  useChartDimensions,
  useCanvasMode,
  useChartMetrics,
  useChartPaths,
  useChartInteraction,
} from './hooks';
import { ChartHeader } from './ChartHeader';
import { ChartSVG } from './ChartSVG';
import { ChartTooltip } from './ChartTooltip';

export function PriceHistoryChart({
  data,
  height = 300,
  showVolume = true,
  currency = 'coins',
  timeRange = '7d',
  onTimeRangeChange,
  className = '',
}: PriceHistoryChartProps) {
  const { containerRef, dimensions } = useChartDimensions(height);
  useCanvasMode(data.length);
  const metrics = useChartMetrics(data);
  const paths = useChartPaths(data, dimensions, metrics, showVolume);
  const { hoveredPoint, handleMouseMove, handleMouseLeave } = useChartInteraction(
    data,
    dimensions,
    metrics,
    containerRef
  );

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-white/5 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="mb-2 text-4xl">📊</div>
          <p>No price history available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <ChartHeader
        metrics={metrics}
        currency={currency}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />

      <ChartSVG
        dimensions={dimensions}
        metrics={metrics}
        paths={paths}
        showVolume={showVolume}
        hoveredPoint={hoveredPoint}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      <ChartTooltip hoveredPoint={hoveredPoint} dimensions={dimensions} currency={currency} />
    </div>
  );
}

export default PriceHistoryChart;
