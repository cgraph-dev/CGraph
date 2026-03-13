/**
 * EarningsChart
 *
 * Simple SVG bar chart for creator earnings.
 * No heavy chart library — uses native SVG elements.
 *
 * @module modules/creator/components/earnings-chart
 */

import { useMemo, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

interface EarningsDatum {
  period: string;
  amount: number;
}

interface EarningsChartProps {
  data: EarningsDatum[];
  period?: 'daily' | 'weekly' | 'monthly';
}

type Period = 'daily' | 'weekly' | 'monthly';

const PERIODS: Period[] = ['daily', 'weekly', 'monthly'];

// ── Constants ──────────────────────────────────────────────────────────

const CHART_HEIGHT = 200;
const BAR_GAP = 4;

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Earnings Chart component. */
export function EarningsChart({ data, period: initialPeriod = 'monthly' }: EarningsChartProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const maxAmount = useMemo(() => Math.max(...data.map((d) => d.amount), 1), [data]);

  if (data.length === 0) {
    return (
      <div className="border-border bg-card text-muted-foreground flex h-52 items-center justify-center rounded-lg border text-sm">
        No earnings data available
      </div>
    );
  }

  const barWidth = Math.max(12, Math.min(40, 600 / data.length - BAR_GAP));
  const svgWidth = data.length * (barWidth + BAR_GAP);

  return (
    <div className="space-y-3">
      {/* Period selector */}
      <div className="border-border bg-muted flex w-fit gap-1 rounded-lg border p-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
              period === p
                ? 'text-primary-foreground bg-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="border-border bg-card overflow-x-auto rounded-lg border p-4">
        <svg
          width={Math.max(svgWidth, 100)}
          height={CHART_HEIGHT + 30}
          viewBox={`0 0 ${Math.max(svgWidth, 100)} ${CHART_HEIGHT + 30}`}
          className="w-full"
          preserveAspectRatio="xMinYEnd meet"
        >
          {data.map((d, i) => {
            const barHeight = (d.amount / maxAmount) * CHART_HEIGHT;
            const x = i * (barWidth + BAR_GAP);
            const y = CHART_HEIGHT - barHeight;

            return (
              <g key={d.period}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={3}
                  className="fill-primary"
                />
                {/* Amount label */}
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-foreground text-[9px]"
                >
                  ${d.amount.toFixed(0)}
                </text>
                {/* Period label */}
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  {d.period.slice(0, 7)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
