/**
 * ModerationQueue — Displays the moderation review queue
 *
 * Shows pending items (threads, posts, comments) that need
 * moderator review, with approve/reject actions and filtering.
 *
 * @module modules/moderation/components/ModerationQueue
 */

import { useCallback, useEffect, useState, memo } from 'react';
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
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const QueueItemCard = memo(function QueueItemCard({
  item,
  onApprove,
  onReject,
}: QueueItemCardProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
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

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FilterStatus)} // safe downcast – select event value
          className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-300"
        >
          <option value="pending">Pending</option>
          <option value="all">All</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)} // safe downcast – select event value
          className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-300"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Queue list */}
      {isLoadingQueue && <div className="py-8 text-center text-gray-500">Loading queue…</div>}

      {!isLoadingQueue && filteredQueue.length === 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/30 py-8 text-center text-gray-500">
          No items in queue
        </div>
      )}

      {!isLoadingQueue && filteredQueue.length > 0 && (
        <div className="space-y-3">
          {filteredQueue.map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
