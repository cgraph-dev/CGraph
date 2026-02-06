/**
 * Utility functions for PriceHistoryChart
 */
import type { PricePoint, ChartMetrics, ChartPaths, ChartDimensions, VolumeBar } from './types';
import { CHART_PADDING } from './constants';

export function calculateMetrics(data: PricePoint[]): ChartMetrics | null {
  if (data.length === 0) return null;

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const latest = prices[prices.length - 1] ?? 0;
  const first = prices[0] ?? 0;
  const change = first > 0 ? ((latest - first) / first) * 100 : 0;

  return {
    min,
    max,
    range: max - min || 1,
    latest,
    first,
    change,
    isPositive: change >= 0,
  };
}

export function calculatePaths(
  data: PricePoint[],
  dimensions: ChartDimensions,
  metrics: ChartMetrics,
  showVolume: boolean
): ChartPaths {
  if (dimensions.width === 0 || data.length === 0) {
    return { linePath: '', areaPath: '', volumeBars: [] };
  }

  const padding = CHART_PADDING;
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;
  const volumeHeight = showVolume ? 50 : 0;
  const priceChartHeight = chartHeight - volumeHeight;

  const xScale = chartWidth / (data.length - 1 || 1);
  const yScale = priceChartHeight / metrics.range;

  const linePoints: string[] = [];
  const areaPoints: string[] = [];

  data.forEach((point, i) => {
    const x = padding.left + i * xScale;
    const y = padding.top + priceChartHeight - (point.price - metrics.min) * yScale;

    if (i === 0) {
      linePoints.push(`M ${x} ${y}`);
      areaPoints.push(`M ${x} ${padding.top + priceChartHeight}`);
      areaPoints.push(`L ${x} ${y}`);
    } else {
      linePoints.push(`L ${x} ${y}`);
      areaPoints.push(`L ${x} ${y}`);
    }
  });

  const lastX = padding.left + (data.length - 1) * xScale;
  areaPoints.push(`L ${lastX} ${padding.top + priceChartHeight}`);
  areaPoints.push('Z');

  const volumeBars: VolumeBar[] = showVolume
    ? (data
        .map((point, i) => {
          if (!point.volume) return null;
          const x = padding.left + i * xScale;
          const maxVolume = Math.max(...data.map((d) => d.volume || 0));
          const barHeight = (point.volume / maxVolume) * volumeHeight;
          return {
            x: x - 2,
            y: chartHeight - barHeight + padding.top,
            width: 4,
            height: barHeight,
            volume: point.volume,
          };
        })
        .filter(Boolean) as VolumeBar[])
    : [];

  return {
    linePath: linePoints.join(' '),
    areaPath: areaPoints.join(' '),
    volumeBars,
  };
}
