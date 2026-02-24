/** JobsStatusCard — displays background job queue metrics (pending, failed, completed). */
import type { SystemMetrics } from '@/types/admin.types';

export function JobsStatusCard({ jobs }: { jobs?: SystemMetrics['jobs'] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Background Jobs</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-2xl font-bold text-yellow-600">{jobs?.pending || 0}</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-2xl font-bold text-blue-600">{jobs?.executing || 0}</p>
          <p className="text-sm text-blue-600">Executing</p>
        </div>
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-2xl font-bold text-red-600">{jobs?.failed || 0}</p>
          <p className="text-sm text-red-600">Failed</p>
        </div>
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-2xl font-bold text-green-600">{jobs?.completed24h || 0}</p>
          <p className="text-sm text-green-600">Completed (24h)</p>
        </div>
      </div>
    </div>
  );
}
