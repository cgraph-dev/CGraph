import type { SystemMetrics } from '@/types/admin.types';
import { ProgressBar } from './progress-bar';

export function SystemHealthCard({ metrics }: { metrics?: SystemMetrics }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
      <div className="space-y-4">
        <ProgressBar
          label="Memory Usage"
          value={metrics?.system.memoryUsageMb || 0}
          max={1024}
          unit="MB"
        />
        <ProgressBar
          label="CPU Usage"
          value={metrics?.system.cpuUsagePercent || 0}
          max={100}
          unit="%"
        />
        <ProgressBar
          label="DB Connections"
          value={metrics?.system.dbConnections || 0}
          max={100}
          unit=""
        />
      </div>
    </div>
  );
}
