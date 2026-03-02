/**
 * AIModrationStats — AI moderation statistics visualization
 *
 * Shows AI decision distribution (allow/flag/block), auto-action rate,
 * and confidence breakdown for the admin moderation dashboard.
 *
 * @module modules/moderation/components/AIModrationStats
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ── Types ────────────────────────────────────────────────────────────

interface AIStatEntry {
  ai_action: string;
  auto_actioned: boolean;
  count: number;
}

interface AIModrationStatsProps {
  data: AIStatEntry[];
}

// ── Constants ────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  allow: '#22c55e',
  flag: '#f59e0b',
  block: '#ef4444',
};

const ACTION_LABELS: Record<string, string> = {
  allow: 'Allowed',
  flag: 'Flagged',
  block: 'Blocked',
};

// ── Component ────────────────────────────────────────────────────────

/**
 * AI moderation stats with donut chart and auto-action rate.
 */
export function AIModrationStats({ data }: AIModrationStatsProps) {
  const entries = data || [];

  const { pieData, totalDecisions, autoActionCount, autoActionRate } = useMemo(() => {
    // Aggregate by action type
    const byAction = new Map<string, number>();
    let total = 0;
    let autoCount = 0;

    for (const entry of entries) {
      const current = byAction.get(entry.ai_action) || 0;
      byAction.set(entry.ai_action, current + entry.count);
      total += entry.count;
      if (entry.auto_actioned) autoCount += entry.count;
    }

    const pie = Array.from(byAction.entries()).map(([action, count]) => ({
      name: ACTION_LABELS[action] || action,
      value: count,
      color: ACTION_COLORS[action] || '#6b7280',
    }));

    return {
      pieData: pie,
      totalDecisions: total,
      autoActionCount: autoCount,
      autoActionRate: total > 0 ? Math.round((autoCount / total) * 100) : 0,
    };
  }, [entries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Moderation</CardTitle>
      </CardHeader>
      <CardContent>
        {totalDecisions === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No AI decisions recorded</p>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
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

            {/* Stats Summary */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-dark-700/50 p-3 text-center">
                <p className="text-lg font-bold text-white">{totalDecisions}</p>
                <p className="text-xs text-gray-400">Total Decisions</p>
              </div>
              <div className="rounded-lg bg-dark-700/50 p-3 text-center">
                <p className="text-lg font-bold text-white">{autoActionCount}</p>
                <p className="text-xs text-gray-400">Auto-Actioned</p>
              </div>
              <div className="rounded-lg bg-dark-700/50 p-3 text-center">
                <p className="text-lg font-bold text-white">{autoActionRate}%</p>
                <p className="text-xs text-gray-400">Auto Rate</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
