/**
 * Constants and configuration for PriceHistoryChart
 */
import type { TimeRangeKey, ChartPadding } from './types';

export const TIME_RANGES: ReadonlyArray<{ key: TimeRangeKey; label: string }> = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: 'all', label: 'All' },
] as const;

export const CHART_PADDING: ChartPadding = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 60,
};

export const CANVAS_THRESHOLD = 1000;

export const GRID_PERCENTAGES = [0, 0.25, 0.5, 0.75, 1];

export const POSITIVE_COLOR = '#22c55e';
export const NEGATIVE_COLOR = '#ef4444';

export const CURRENCY_ICONS: Record<'coins' | 'gems', string> = {
  coins: '🪙',
  gems: '💎',
};
