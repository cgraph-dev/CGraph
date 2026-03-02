/**
 * ModerationDashboard — Admin moderation metrics dashboard
 *
 * Aggregates all moderation metrics in a single view: summary cards,
 * report trends, moderator leaderboard, AI stats, and appeals distribution.
 *
 * Fetches data from `GET /api/admin/moderation/stats` with auto-refresh.
 *
 * @module modules/admin/components/ModerationDashboard
 */

import { useCallback, useEffect, useState } from 'react';
import Card, { CardContent } from '@/components/ui/card';
import { ModerationTrends } from '@/modules/moderation/components/moderation-trends';
import { ModeratorLeaderboard } from '@/modules/moderation/components/moderator-leaderboard';
import { AIModrationStats } from '@/modules/moderation/components/ai-moderation-stats';
import { AppealsStats } from '@/modules/moderation/components/appeals-stats';
import { AnimatedEmptyState, AnimatedErrorState } from '@/shared/components';
import { api } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────

interface ModerationStats {
  reports_today: number;
  avg_response_time: number | null;
  active_restrictions: number;
  resolution_rate: number;
  reports_by_category: Record<string, number>;
  reports_trend: Array<{ date: string; count: number }>;
  moderator_leaderboard: Array<{
    reviewer_id: string;
    username?: string;
    display_name?: string;
    actions_count: number;
    last_action: string;
  }>;
  ai_stats: Array<{
    ai_action: string;
    auto_actioned: boolean;
    count: number;
  }>;
  appeals_stats: Record<string, number>;
}

// ── Sub-components ───────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  color?: string;
}

function StatCard({ title, value, unit, color = 'text-white' }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className={`text-2xl font-bold ${color}`}>
            {value ?? '—'}
          </p>
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────

/**
 * Admin moderation dashboard with comprehensive metrics.
 */
export function ModerationDashboard() {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/moderation/stats');
      setStats(data.data || data);
      setError(null);
    } catch (err) {
      setError('Failed to load moderation stats');
      console.error('Failed to fetch moderation stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <AnimatedErrorState
        title="Failed to load moderation data"
        description={error || 'No data available. The moderation stats API may be unreachable.'}
        onRetry={() => {
          setLoading(true);
          fetchStats();
        }}
      />
    );
  }

  // Check if stats are effectively empty (no activity)
  const hasActivity = stats.reports_today > 0
    || stats.active_restrictions > 0
    || (stats.reports_trend && stats.reports_trend.length > 0)
    || (stats.moderator_leaderboard && stats.moderator_leaderboard.length > 0);

  if (!hasActivity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Moderation Dashboard</h1>
          <button
            onClick={() => {
              setLoading(true);
              fetchStats();
            }}
            className="rounded-lg bg-dark-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-dark-600 hover:text-white"
          >
            Refresh
          </button>
        </div>
        <AnimatedEmptyState
          title="No moderation activity"
          description="No reports, restrictions, or moderation actions recorded yet. Activity will appear here once users start interacting."
          variant="inbox"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Moderation Dashboard</h1>
        <button
          onClick={() => {
            setLoading(true);
            fetchStats();
          }}
          className="rounded-lg bg-dark-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-dark-600 hover:text-white"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Reports Today" value={stats.reports_today} />
        <StatCard
          title="Avg Response Time"
          value={stats.avg_response_time != null ? stats.avg_response_time.toFixed(1) : '—'}
          unit="hrs"
        />
        <StatCard
          title="Resolution Rate"
          value={stats.resolution_rate != null ? stats.resolution_rate.toFixed(1) : '—'}
          unit="%"
          color={stats.resolution_rate > 80 ? 'text-green-400' : 'text-yellow-400'}
        />
        <StatCard title="Active Restrictions" value={stats.active_restrictions} />
      </div>

      {/* Reports Trend Chart */}
      <ModerationTrends data={stats.reports_trend} byCategory={stats.reports_by_category} />

      {/* Two-Column Layout: Leaderboard + AI Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModeratorLeaderboard data={stats.moderator_leaderboard} />
        <AIModrationStats data={stats.ai_stats} />
      </div>

      {/* Appeals Distribution */}
      <AppealsStats data={stats.appeals_stats} />
    </div>
  );
}
