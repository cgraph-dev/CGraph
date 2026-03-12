/**
 * Enterprise Analytics Panel
 *
 * Platform-wide analytics: overview metrics, org breakdown, and time series.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { enterpriseAnalyticsApi } from '../../api/enterprise-api';
import type {
  AnalyticsOverview,
  OrgBreakdown,
  AnalyticsTimeSeriesPoint,
} from '../../api/enterprise-types';

function MetricCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: number;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {delta !== undefined && (
        <p className={`mt-1 text-xs ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta >= 0 ? '+' : ''}
          {delta}% from last period
        </p>
      )}
    </div>
  );
}

/** Renders platform analytics overview with org breakdown, time-series charts, and CSV export. */
export function EnterpriseAnalytics(): React.ReactElement {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [orgBreakdown, setOrgBreakdown] = useState<OrgBreakdown | null>(null);
  const [timeSeries, setTimeSeries] = useState<AnalyticsTimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = 'current';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, orgs, ts] = await Promise.all([
        enterpriseAnalyticsApi.getOverview(),
        enterpriseAnalyticsApi.getOrgBreakdown(orgId),
        enterpriseAnalyticsApi.getTimeSeries('messages'),
      ]);
      setOverview(ov);
      setOrgBreakdown(orgs);
      setTimeSeries(ts);
    } catch {
      // Error handled by API layer
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleExport = useCallback(async () => {
    try {
      const data = await enterpriseAnalyticsApi.exportOrgAnalytics(orgId);
      const csv = data.map((row) => Object.values(row).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error handled by API layer
    }
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      key="enterprise-analytics"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enterprise Analytics</h1>
          <p className="mt-1 text-sm text-gray-400">
            Platform-wide metrics and organizational insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Total Users" value={overview.users.total.toLocaleString()} />
          <MetricCard label="Total Groups" value={overview.groups.total.toLocaleString()} />
          <MetricCard label="Messages Today" value={overview.messages.today.toLocaleString()} />
          <MetricCard label="Organizations" value={overview.organizations.total.toLocaleString()} />
        </div>
      )}

      {/* Time Series */}
      {timeSeries.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Message Volume</h3>
          <div className="flex h-40 items-end gap-1">
            {timeSeries.map((point, i) => {
              const max = Math.max(...timeSeries.map((p) => p.value), 1);
              const height = (point.value / max) * 100;
              return (
                <div
                  key={i}
                  className="group relative flex-1"
                  title={`${point.date}: ${point.value}`}
                >
                  <div
                    className="w-full rounded-t bg-green-500/60 transition-colors group-hover:bg-green-400"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>{timeSeries[0]?.date}</span>
            <span>{timeSeries[timeSeries.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Org Breakdown */}
      {orgBreakdown && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Organization Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-bold text-white">{orgBreakdown.members}</p>
              <p className="text-sm text-gray-400">Members</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-bold text-white">{orgBreakdown.groups}</p>
              <p className="text-sm text-gray-400">Groups</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
