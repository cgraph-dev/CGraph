/**
 * ModerationQueue — Displays the moderation review queue
 *
 * Shows pending items (threads, posts, comments) that need
 * moderator review, with approve/reject actions, filtering,
 * and bulk moderation capabilities.
 *
 * @module modules/moderation/components/ModerationQueue
 */

import { useCallback, useEffect, useState, useMemo, memo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useModerationStore } from '../store';
import type { ModerationQueueItem } from '../store/moderationStore.types';

// ── Constants ────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<ModerationQueueItem['priority'], string> = {
  low: 'bg-gray-500/20 text-gray-400',
  normal: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

const STATUS_LABELS: Record<ModerationQueueItem['status'], string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

// ── Sub-components ───────────────────────────────────────────────────

interface QueueItemCardProps {
  item: ModerationQueueItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const QueueItemCard = memo(function QueueItemCard({
  item,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
}: QueueItemCardProps) {
  return (
    <div
      className={`rounded-lg border ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-white/[0.08] bg-white/[0.04]'} p-4`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.status === 'pending' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              className="h-4 w-4 rounded border-white/[0.08] bg-white/[0.06] text-blue-600 focus:ring-blue-500"
              aria-label={`Select report ${item.id}`}
            />
          )}
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}
          >
            {item.priority}
          </span>
          <span className="text-xs text-gray-500">{item.itemType}</span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>

      {item.title && <h4 className="mb-1 text-sm font-medium text-white">{item.title}</h4>}

      <p className="mb-2 line-clamp-3 text-sm text-gray-300">{item.contentPreview}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          by {item.authorUsername}
          {item.reportCount > 0 && ` · ${item.reportCount} reports`}
        </span>

        {item.status === 'pending' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onApprove(item.id)}
              className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject(item.id)}
              className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
            >
              Reject
            </button>
          </div>
        )}

        {item.status !== 'pending' && (
          <span className="text-xs text-gray-500">{STATUS_LABELS[item.status]}</span>
        )}
      </div>
    </div>
  );
});

// ── Filters ──────────────────────────────────────────────────────────

type FilterStatus = 'pending' | 'all';
type FilterPriority = 'all' | 'low' | 'normal' | 'high' | 'critical';

// ── Main Component ───────────────────────────────────────────────────

/**
 * unknown for the moderation module.
 */
/**
 * Moderation Queue component.
 */
export function ModerationQueue() {
  const {
    queue,
    isLoadingQueue,
    queueCounts,
    fetchModerationQueue,
    approveQueueItem,
    rejectQueueItem,
  } = useModerationStore();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchConfirm, setShowBatchConfirm] = useState<string | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    void fetchModerationQueue({
      status: statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
    });
  }, [fetchModerationQueue, statusFilter, priorityFilter]);

  const handleApprove = useCallback((id: string) => void approveQueueItem(id), [approveQueueItem]);

  const handleReject = useCallback(
    (id: string) => void rejectQueueItem(id, 'Rejected by moderator'),
    [rejectQueueItem]
  );

  // Bulk selection handlers
  const pendingItems = useMemo(() => queue.filter((item) => item.status === 'pending'), [queue]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === pendingItems.length) {
        return new Set();
      }
      return new Set(pendingItems.map((item) => item.id));
    });
  }, [pendingItems]);

  // Batch review mutation
  const batchReviewMutation = useMutation({
    mutationFn: async ({ action, notes }: { action: string; notes?: string }) => {
      const response = await api.post('/api/admin/reports/batch-review', {
        report_ids: Array.from(selectedIds),
        action,
        notes: notes ?? `Batch ${action} by moderator`,
      });
      return response.data;
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      setShowBatchConfirm(null);
      void fetchModerationQueue({
        status: statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
    },
  });

  const handleBatchAction = useCallback((action: string) => {
    setShowBatchConfirm(action);
  }, []);

  const confirmBatchAction = useCallback(() => {
    if (showBatchConfirm) {
      batchReviewMutation.mutate({ action: showBatchConfirm });
    }
  }, [showBatchConfirm, batchReviewMutation]);

  const filteredQueue =
    priorityFilter === 'all' ? queue : queue.filter((item) => item.priority === priorityFilter);

  return (
    <div className="space-y-4">
      {/* Header with counts */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Moderation Queue</h2>
        <div className="flex gap-3 text-sm text-gray-400">
          <span>Pending: {queueCounts.pending}</span>
          <span>Flagged: {queueCounts.flagged}</span>
          <span>Reported: {queueCounts.reported}</span>
        </div>
      </div>

      {/* Filters + Select All */}
      <div className="flex items-center gap-2">
        {pendingItems.length > 0 && statusFilter === 'pending' && (
          <label className="flex items-center gap-1.5 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={selectedIds.size === pendingItems.length && pendingItems.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-white/[0.08] bg-white/[0.06] text-blue-600 focus:ring-blue-500"
            />
            Select all
          </label>
        )}
        <select
          value={statusFilter}
           
          onChange={(e) => setStatusFilter(e.target.value as FilterStatus)} // safe downcast – select event value
          className="rounded bg-white/[0.04] px-3 py-1.5 text-sm text-gray-300"
        >
          <option value="pending">Pending</option>
          <option value="all">All</option>
        </select>
        <select
          value={priorityFilter}
           
          onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)} // safe downcast – select event value
          className="rounded bg-white/[0.04] px-3 py-1.5 text-sm text-gray-300"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-900/80 px-4 py-3 backdrop-blur-sm">
          <span className="text-sm font-medium text-blue-200">{selectedIds.size} selected</span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => handleBatchAction('dismiss')}
              disabled={batchReviewMutation.isPending}
              className="rounded bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-500 disabled:opacity-50"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('warn')}
              disabled={batchReviewMutation.isPending}
              className="rounded bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-500 disabled:opacity-50"
            >
              Warn
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('approve')}
              disabled={batchReviewMutation.isPending}
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Approve
            </button>
          </div>
        </div>
      )}

      {/* Batch confirm dialog */}
      {showBatchConfirm && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/30 p-4">
          <p className="mb-3 text-sm text-yellow-200">
            Are you sure you want to <strong>{showBatchConfirm}</strong> {selectedIds.size} report
            {selectedIds.size > 1 ? 's' : ''}?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmBatchAction}
              disabled={batchReviewMutation.isPending}
              className="rounded bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-500 disabled:opacity-50"
            >
              {batchReviewMutation.isPending ? 'Processing…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setShowBatchConfirm(null)}
              className="rounded bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
          {batchReviewMutation.isError && (
            <p className="mt-2 text-xs text-red-400">Batch action failed. Please try again.</p>
          )}
        </div>
      )}

      {/* Queue list */}
      {isLoadingQueue && <div className="py-8 text-center text-gray-500">Loading queue…</div>}

      {!isLoadingQueue && filteredQueue.length === 0 && (
        <div className="bg-white/[0.04]/30 rounded-lg border border-white/[0.08] py-8 text-center text-gray-500">
          No items in queue
        </div>
      )}

      {!isLoadingQueue && filteredQueue.length > 0 && (
        <div className="space-y-3">
          {filteredQueue.map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={handleToggleSelect}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
