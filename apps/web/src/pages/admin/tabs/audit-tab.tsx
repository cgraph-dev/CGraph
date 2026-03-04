/**
 * Admin audit log tab component.
 * @module
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { adminApi } from '@/modules/admin/api';
import { format } from 'date-fns';
import clsx from 'clsx';
import type { AuditEntry } from '@/types/admin.types';
import { LoadingState } from '@/modules/admin/components';

// ============================================================================
// Audit Log Tab - View system audit logs
// ============================================================================

/**
 * unknown for the admin module.
 */
/**
 * Audit Tab component.
 */
export function AuditTab() {
  const [page] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['admin', 'audit', { category: categoryFilter, page }],
    queryFn: () => adminApi.getAuditLog({ category: categoryFilter, page, perPage: 50 }),
  });

  const categories = ['all', 'auth', 'user', 'admin', 'data', 'security'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={clsx(
                'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors',
                categoryFilter === category
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {auditData?.entries.map((entry: AuditEntry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(entry.timestamp), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {entry.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">@{entry.actorUsername}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-500">{entry.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
