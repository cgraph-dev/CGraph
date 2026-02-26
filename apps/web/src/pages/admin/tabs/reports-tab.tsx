/**
 * Admin reports tab component.
 * @module
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { adminApi } from '@/modules/admin/api';
import { formatTimeAgo } from '@/lib/utils';
import clsx from 'clsx';
import type { Report } from '@/types/admin.types';
import { StatusBadge, LoadingState, EmptyState } from '@/modules/admin/components';

// ============================================================================
// Reports Tab - Moderation reports management
// ============================================================================

/**
 * unknown for the admin module.
 */
/**
 * Reports Tab component.
 */
export function ReportsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['admin', 'reports', { status: statusFilter }],
    queryFn: () => adminApi.listReports({ status: statusFilter }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      reportId,
      action,
      note,
    }: {
      reportId: string;
      action: 'resolve' | 'dismiss';
      note?: string;
    }) => adminApi.resolveReport(reportId, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex space-x-2">
          {['pending', 'resolved', 'dismissed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={clsx(
                'rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors',
                statusFilter === status
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingState />
        ) : reportsData?.reports.length === 0 ? (
          <EmptyState message="No reports found" />
        ) : (
          reportsData?.reports.map((report: Report) => (
            <ReportCard
              key={report.id}
              report={report}
              onResolve={(action, note) =>
                resolveMutation.mutate({ reportId: report.id, action, note })
              }
              isResolving={resolveMutation.isPending}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// ReportCard - Individual report card with resolve/dismiss actions
// ============================================================================

function ReportCard({
  report,
  onResolve,
  isResolving,
}: {
  report: Report;
  onResolve: (action: 'resolve' | 'dismiss', note?: string) => void;
  isResolving: boolean;
}) {
  const typeColors: Record<string, string> = {
    spam: 'bg-yellow-100 text-yellow-700',
    harassment: 'bg-red-100 text-red-700',
    hate_speech: 'bg-red-100 text-red-700',
    illegal: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center space-x-3">
            <span
              className={clsx(
                'rounded-full px-2 py-1 text-xs font-medium',
                typeColors[report.type]
              )}
            >
              {report.type.replace('_', ' ')}
            </span>
            <StatusBadge status={report.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">{report.contentType}</span>
          </div>

          <p className="mb-2 text-gray-900 dark:text-white">{report.reason}</p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Reported by <span className="font-medium">@{report.reporterUsername}</span>
            {' • '}
            {formatTimeAgo(report.insertedAt)}
          </p>
        </div>

        {report.status === 'pending' && (
          <div className="ml-4 flex space-x-2">
            <button
              onClick={() => onResolve('resolve')}
              disabled={isResolving}
              className="flex items-center space-x-1 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Resolve</span>
            </button>
            <button
              onClick={() => onResolve('dismiss')}
              disabled={isResolving}
              className="flex items-center space-x-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>Dismiss</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
