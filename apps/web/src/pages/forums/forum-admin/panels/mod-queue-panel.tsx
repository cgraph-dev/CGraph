/**
 * Mod Queue Panel
 *
 * Review reports and pending content.
 *
 * @module pages/forums/ForumAdmin/panels/ModQueuePanel
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { CheckIcon, XMarkIcon, FlagIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ModQueueItem } from '../types';

interface ModQueuePanelProps {
  modQueue: ModQueueItem[];
  queueFilter: 'all' | 'pending' | 'reports';
  onFilterChange: (filter: 'all' | 'pending' | 'reports') => void;
  onAction: (itemId: string, action: 'approve' | 'reject') => void;
}

export const ModQueuePanel = memo(function ModQueuePanel({
  modQueue,
  queueFilter,
  onFilterChange,
  onAction,
}: ModQueuePanelProps) {
  const filteredQueue = modQueue.filter(
    (item) =>
      queueFilter === 'all' ||
      (queueFilter === 'pending' && item.status === 'pending') ||
      (queueFilter === 'reports' && item.type === 'report')
  );

  return (
    <motion.div
      key="modqueue"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Moderation Queue</h2>
        <p className="text-gray-400">Review reports and pending content.</p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        {(['all', 'pending', 'reports'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              queueFilter === filter
                ? 'bg-primary-500 text-white'
                : 'bg-white/[0.06] text-gray-400 hover:text-white'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <GlassCard className="p-6">
        {filteredQueue.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <CheckIcon className="mx-auto mb-3 h-12 w-12 text-green-400" />
            <p className="text-lg font-medium text-white">All caught up!</p>
            <p className="text-sm">No items need your attention.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQueue.map((item) => (
              <motion.div
                key={item.id}
                className={`rounded-lg border p-4 ${
                  item.status === 'pending'
                    ? 'border-white/[0.08] bg-white/[0.06]'
                    : item.status === 'approved'
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-red-500/30 bg-red-500/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      item.type === 'report' ? 'bg-red-500/20' : 'bg-blue-500/20'
                    }`}
                  >
                    {item.type === 'report' ? (
                      <FlagIcon className="h-5 w-5 text-red-400" />
                    ) : (
                      <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          item.type === 'report'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-sm text-gray-400">by {item.author}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-white">{item.content}</p>
                    {item.reason && (
                      <p className="mt-1 text-sm text-red-400">Reason: {item.reason}</p>
                    )}
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => onAction(item.id, 'approve')}
                        className="rounded-lg bg-green-500/20 p-2 text-green-400 hover:bg-green-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckIcon className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => onAction(item.id, 'reject')}
                        className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </motion.button>
                    </div>
                  )}
                  {item.status !== 'pending' && (
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        item.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
});
