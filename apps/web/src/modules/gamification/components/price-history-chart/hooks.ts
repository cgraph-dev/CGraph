/**
 * Custom hooks for PriceHistoryChart
 */
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type {
  PricePoint,
  ChartDimensions,
  ChartMetrics,
  ChartPaths,
  HoveredPointData,
} from './types';
import { CANVAS_THRESHOLD, CHART_PADDING } from './constants';
import { calculateMetrics, calculatePaths } from './utils';

export function useChartDimensions(height: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({ width: 0, height });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height,
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [height]);

  return { containerRef, dimensions };
}

export function useCanvasMode(dataLength: number) {
  const [useCanvas, setUseCanvas] = useState(false);

  useEffect(() => {
    setUseCanvas(dataLength > CANVAS_THRESHOLD);
  }, [dataLength]);

  // Reserved for canvas rendering mode
  void useCanvas;

  return useCanvas;
}

export function useChartMetrics(data: PricePoint[]): ChartMetrics | null {
  return useMemo(() => calculateMetrics(data), [data]);
}

export function useChartPaths(
  data: PricePoint[],
  dimensions: ChartDimensions,
  metrics: ChartMetrics | null,
  showVolume: boolean
): ChartPaths {
  return useMemo(() => {
    if (!metrics) {
      return { linePath: '', areaPath: '', volumeBars: [] };
    }
    return calculatePaths(data, dimensions, metrics, showVolume);
  }, [data, dimensions, metrics, showVolume]);
}

export function useChartInteraction(
  data: PricePoint[],
  dimensions: ChartDimensions,
  metrics: ChartMetrics | null,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPointData | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!containerRef.current || data.length === 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const padding = { left: CHART_PADDING.left, right: CHART_PADDING.right };
      const chartWidth = dimensions.width - padding.left - padding.right;

      const mouseX = e.clientX - rect.left - padding.left;
      const index = Math.round((mouseX / chartWidth) * (data.length - 1));

      if (index >= 0 && index < data.length) {
        const point = data[index];
        if (!point) return;
        const x = padding.left + (index / (data.length - 1)) * chartWidth;
        const yScale = (dimensions.height - 60) / (metrics?.range || 1);
        const y = 20 + (dimensions.height - 60) - (point.price - (metrics?.min || 0)) * yScale;

        setHoveredPoint({ point, x, y });
      }
    },
    [data, dimensions, metrics, containerRef]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
  }, []);

  return { hoveredPoint, handleMouseMove, handleMouseLeave };
}
