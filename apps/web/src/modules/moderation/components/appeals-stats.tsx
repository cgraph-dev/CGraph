/**
 * AppealsStats — Appeal outcome distribution
 *
 * Displays a pie chart of appeal outcomes (pending/approved/denied)
 * with summary counts for the admin moderation dashboard.
 *
 * @module modules/moderation/components/AppealsStats
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ── Types ────────────────────────────────────────────────────────────

interface AppealsStatsProps {
  data: Record<string, number>;
}

// ── Constants ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  denied: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

// ── Component ────────────────────────────────────────────────────────

/**
 * Appeals outcome pie chart with status breakdown.
 */
export function AppealsStats({ data }: AppealsStatsProps) {
  const { pieData, totalAppeals, approvalRate } = useMemo(() => {
    const entries = Object.entries(data || {});
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const approved = (data || {})['approved'] || 0;
    const denied = (data || {})['denied'] || 0;
    const decided = approved + denied;

    const pie = entries
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        color: STATUS_COLORS[status] || '#6b7280',
      }));

    return {
      pieData: pie,
      totalAppeals: total,
      approvalRate: decided > 0 ? Math.round((approved / decided) * 100) : 0,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Appeals Distribution</CardTitle>
          <span className="text-sm text-gray-400">{totalAppeals} total</span>
        </div>
      </CardHeader>
      <CardContent>
        {totalAppeals === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No appeals filed</p>
        ) : (
          <div className="flex items-center gap-6">
            {/* Pie Chart */}
            <div className="h-[180px] w-[180px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3">
              {Object.entries(data || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[status] || '#6b7280' }}
                    />
                    <span className="text-sm text-gray-300">
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              ))}

              <div className="mt-3 border-t border-dark-700 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Approval Rate</span>
                  <span className="text-sm font-bold text-white">{approvalRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
