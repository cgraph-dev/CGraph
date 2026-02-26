/**
 * ChartHeader - displays current price, change indicator, and time range selector
 */
import type { ChartMetrics, TimeRangeKey } from './types';
import { TIME_RANGES, CURRENCY_ICONS } from './constants';

interface ChartHeaderProps {
  metrics: ChartMetrics | null;
  currency: 'coins' | 'gems';
  timeRange: TimeRangeKey;
  onTimeRangeChange?: (range: TimeRangeKey) => void;
}

/**
 * unknown for the gamification module.
 */
/**
 * Chart Header component.
 */
export function ChartHeader({ metrics, currency, timeRange, onTimeRangeChange }: ChartHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-white">
            {(metrics?.latest ?? 0).toLocaleString()} {CURRENCY_ICONS[currency]}
          </span>
          <span
            className={`text-sm font-medium ${
              metrics?.isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {metrics?.isPositive ? '▲' : '▼'} {Math.abs(metrics?.change || 0).toFixed(2)}%
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Range: {metrics?.min.toLocaleString()} — {metrics?.max.toLocaleString()}
        </p>
      </div>

      <div className="flex rounded-lg bg-black/30 p-1">
        {TIME_RANGES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTimeRangeChange?.(key)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              timeRange === key ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
