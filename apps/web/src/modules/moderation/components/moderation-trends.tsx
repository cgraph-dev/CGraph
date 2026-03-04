/**
 * ModerationTrends — Reports-by-category trend chart
 *
 * Displays a line/area chart showing report volume over time,
 * with category breakdown for the admin moderation dashboard.
 *
 * @module modules/moderation/components/ModerationTrends
 */

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ── Types ────────────────────────────────────────────────────────────

interface TrendDataPoint {
  date: string;
  count: number;
}

interface ModerationTrendsProps {
  data: TrendDataPoint[];
  byCategory: Record<string, number>;
}

// ── Constants ────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  spam: '#f59e0b',
  harassment: '#ef4444',
  hate_speech: '#dc2626',
  violence: '#b91c1c',
  sexual: '#ec4899',
  scam: '#f97316',
  other: '#6b7280',
};

// ── Component ────────────────────────────────────────────────────────

/**
 * Report trends area chart with 30-day history.
 */
export function ModerationTrends({ data, byCategory }: ModerationTrendsProps) {
  const chartData = useMemo(
    () =>
      (data || []).map((item) => ({
        date: new Date(item.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        reports: item.count,
      })),
    [data]
  );

  const categoryEntries = useMemo(
    () =>
      Object.entries(byCategory || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8),
    [byCategory]
  );

  const totalReports = categoryEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Report Trends (30 days)</CardTitle>
          <span className="text-sm text-gray-400">{totalReports} total reports</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Trend Chart */}
        <div className="mb-6 h-[280px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorReports)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-400">Reports by Category</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categoryEntries.map(([category, count]) => (
              <div
                key={category}
                className="flex items-center justify-between rounded-lg bg-white/[0.06] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: CATEGORY_COLORS[category] || '#6b7280',
                    }}
                  />
                  <span className="text-xs capitalize text-gray-300">
                    {category.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-xs font-semibold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
