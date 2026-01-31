/**
 * ModerationQueue Page
 *
 * Dedicated moderation queue page for forum moderators and admins.
 * Features filtering, bulk actions, and detailed item review.
 *
 * @version 0.9.4
 * @since 2026-01-20
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useModerationStore, type ModerationQueueItem } from '@/stores/moderationStore';
import { useAuthStore } from '@/stores/authStore';
import GlassCard from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ==================== TYPE DEFINITIONS ====================

interface FilterState {
  status: 'pending' | 'all';
  itemType: 'all' | 'thread' | 'post' | 'comment' | 'user' | 'attachment';
  priority: 'all' | 'low' | 'normal' | 'high' | 'critical';
  reason: 'all' | 'new_user' | 'flagged' | 'auto_spam' | 'reported' | 'manual';
  searchQuery: string;
}

// Type-safe filter update helpers
type FilterKey = keyof FilterState;
const createFilterUpdater =
  <K extends FilterKey>(setFilters: React.Dispatch<React.SetStateAction<FilterState>>, key: K) =>
  (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value as FilterState[K] }));
  };

interface QueueItemCardProps {
  item: ModerationQueueItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPreview?: (item: ModerationQueueItem) => void;
}

// ==================== CONSTANTS ====================

const ITEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  thread: <DocumentTextIcon className="h-5 w-5" />,
  post: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
  comment: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
  user: <UserIcon className="h-5 w-5" />,
  attachment: <PhotoIcon className="h-5 w-5" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400 bg-gray-500/20',
  normal: 'text-blue-400 bg-blue-500/20',
  high: 'text-amber-400 bg-amber-500/20',
  critical: 'text-red-400 bg-red-500/20',
};

const REASON_LABELS: Record<string, string> = {
  new_user: 'New User',
  flagged: 'Auto-Flagged',
  auto_spam: 'Spam Detection',
  reported: 'User Report',
  manual: 'Manual Review',
};

// ==================== QUEUE ITEM CARD ====================

function QueueItemCard({ item, isSelected, onSelect, onApprove, onReject }: QueueItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-xl border transition-all',
        isSelected
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-dark-600 bg-dark-800 hover:border-dark-500'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        {/* Checkbox */}
        <button
          onClick={() => onSelect(item.id)}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border transition-colors',
            isSelected
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-dark-500 hover:border-primary-500'
          )}
        >
          {isSelected && <CheckIcon className="h-3 w-3" />}
        </button>

        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-700 text-gray-400">
          {ITEM_TYPE_ICONS[item.itemType]}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-white">
              {item.title || item.contentPreview.slice(0, 50)}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                PRIORITY_COLORS[item.priority]
              )}
            >
              {item.priority}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            <span>by @{item.authorUsername}</span>
            {item.forumName && (
              <>
                <span>•</span>
                <span>in {item.forumName}</span>
              </>
            )}
            <span>•</span>
            <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Reason Badge */}
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-dark-700 px-2 py-1 text-xs text-gray-400">
            {REASON_LABELS[item.reason]}
          </span>
          {item.reportCount > 0 && (
            <span className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-400">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" />
              {item.reportCount}
            </span>
          )}
        </div>

        {/* Expand Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
          animate={{ rotate: isExpanded ? 180 : 0 }}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-dark-600 p-4">
              {/* Full Content Preview */}
              <div className="mb-4 rounded-lg bg-dark-900 p-4">
                <p className="text-sm text-gray-300">{item.content}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    // Preview functionality - could open in new tab or modal
                    if (item.itemType === 'thread') {
                      window.open(`/forums/thread/${item.itemId}`, '_blank');
                    } else if (item.itemType === 'post' || item.itemType === 'comment') {
                      // For posts/comments, navigate to the item directly
                      window.open(`/forums/post/${item.itemId}`, '_blank');
                    } else if (item.itemType === 'user') {
                      window.open(`/profile/${item.authorId}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-dark-700 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-600 hover:text-white"
                >
                  <EyeIcon className="h-4 w-4" />
                  View Original
                </button>

                <div className="flex gap-2">
                  <motion.button
                    onClick={() => onReject(item.id)}
                    className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Reject
                  </motion.button>
                  <motion.button
                    onClick={() => onApprove(item.id)}
                    className="flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Approve
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function ModerationQueue() {
  const { user } = useAuthStore();
  const {
    queue,
    queueCounts,
    isLoadingQueue,
    fetchModerationQueue,
    approveQueueItem,
    rejectQueueItem,
  } = useModerationStore();

  const [filters, setFilters] = useState<FilterState>({
    status: 'pending',
    itemType: 'all',
    priority: 'all',
    reason: 'all',
    searchQuery: '',
  });

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch queue on mount and filter change
  useEffect(() => {
    fetchModerationQueue({
      status: filters.status,
      itemType: filters.itemType !== 'all' ? filters.itemType : undefined,
      priority: filters.priority !== 'all' ? filters.priority : undefined,
    });
  }, [filters.status, filters.itemType, filters.priority, fetchModerationQueue]);

  // Filtered items
  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      if (filters.reason !== 'all' && item.reason !== filters.reason) return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          item.content.toLowerCase().includes(query) ||
          item.authorUsername.toLowerCase().includes(query) ||
          (item.title?.toLowerCase().includes(query) ?? false)
        );
      }
      return true;
    });
  }, [queue, filters.reason, filters.searchQuery]);

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(new Set(filteredQueue.map((item) => item.id)));
  }, [filteredQueue]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Action handlers
  const handleApprove = useCallback(
    async (id: string) => {
      await approveQueueItem(id);
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [approveQueueItem]
  );

  const handleReject = useCallback((id: string) => {
    setRejectingItemId(id);
    setRejectModalOpen(true);
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectingItemId) return;
    await rejectQueueItem(rejectingItemId, rejectReason);
    setRejectModalOpen(false);
    setRejectingItemId(null);
    setRejectReason('');
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(rejectingItemId);
      return next;
    });
  }, [rejectingItemId, rejectReason, rejectQueueItem]);

  // Bulk actions
  const handleBulkApprove = useCallback(async () => {
    for (const id of selectedItems) {
      await approveQueueItem(id);
    }
    clearSelection();
  }, [selectedItems, approveQueueItem, clearSelection]);

  const handleBulkReject = useCallback(() => {
    if (selectedItems.size > 0) {
      setRejectingItemId(Array.from(selectedItems).join(','));
      setRejectModalOpen(true);
    }
  }, [selectedItems]);

  // Check permissions
  if (!user?.isAdmin) {
    // For now, only admins can access. Later we can check moderator role
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <ShieldCheckIcon className="mb-4 h-16 w-16 text-gray-600" />
        <h2 className="mb-2 text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-center text-gray-400">
          You need moderator permissions to access the moderation queue.
        </p>
        <Link
          to="/forums"
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Back to Forums
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
            <ShieldCheckIcon className="h-7 w-7 text-primary-400" />
            Moderation Queue
          </h1>
          <p className="mt-1 text-gray-400">Review and moderate pending content</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Queue Stats */}
          <div className="flex gap-3">
            <div className="rounded-lg bg-amber-500/20 px-3 py-2 text-center">
              <div className="text-lg font-bold text-amber-400">{queueCounts.pending}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div className="rounded-lg bg-red-500/20 px-3 py-2 text-center">
              <div className="text-lg font-bold text-red-400">{queueCounts.reported}</div>
              <div className="text-xs text-gray-400">Reported</div>
            </div>
            <div className="rounded-lg bg-purple-500/20 px-3 py-2 text-center">
              <div className="text-lg font-bold text-purple-400">{queueCounts.flagged}</div>
              <div className="text-xs text-gray-400">Flagged</div>
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchModerationQueue()}
            disabled={isLoadingQueue}
            className="rounded-lg bg-dark-700 p-2.5 text-gray-400 transition-colors hover:bg-dark-600 hover:text-white"
          >
            <ArrowPathIcon className={cn('h-5 w-5', isLoadingQueue && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search content or username..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full rounded-lg border border-dark-500 bg-dark-700 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={createFilterUpdater(setFilters, 'status')}
            className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
          >
            <option value="pending">Pending Only</option>
            <option value="all">All Status</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.itemType}
            onChange={createFilterUpdater(setFilters, 'itemType')}
            className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
          >
            <option value="all">All Types</option>
            <option value="thread">Threads</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="user">Users</option>
            <option value="attachment">Attachments</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={createFilterUpdater(setFilters, 'priority')}
            className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Reason Filter */}
          <select
            value={filters.reason}
            onChange={createFilterUpdater(setFilters, 'reason')}
            className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
          >
            <option value="all">All Reasons</option>
            <option value="new_user">New User</option>
            <option value="flagged">Auto-Flagged</option>
            <option value="auto_spam">Spam Detection</option>
            <option value="reported">User Report</option>
            <option value="manual">Manual Review</option>
          </select>
        </div>
      </GlassCard>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between rounded-xl border border-primary-500/30 bg-primary-500/10 p-4"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="rounded-lg bg-dark-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-dark-600"
              >
                Clear
              </button>
              <span className="text-sm text-gray-400">
                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={handleBulkReject}
                className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <TrashIcon className="h-4 w-4" />
                Reject All
              </motion.button>
              <motion.button
                onClick={handleBulkApprove}
                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircleIcon className="h-4 w-4" />
                Approve All
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue List */}
      {isLoadingQueue ? (
        <div className="flex h-64 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent"
          />
        </div>
      ) : filteredQueue.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center p-12">
          <CheckCircleIcon className="mb-4 h-16 w-16 text-green-500" />
          <h3 className="mb-2 text-lg font-semibold text-white">Queue is Empty</h3>
          <p className="text-center text-gray-400">
            No items require moderation right now. Great job!
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-4">
            <button onClick={selectAll} className="text-sm text-primary-400 hover:text-primary-300">
              Select All ({filteredQueue.length})
            </button>
          </div>

          {/* Items */}
          <AnimatePresence mode="popLayout">
            {filteredQueue.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onSelect={toggleSelect}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setRejectModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-dark-600 bg-dark-800 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-lg font-bold text-white">Reject Content</h3>
              <p className="mb-4 text-sm text-gray-400">
                Please provide a reason for rejecting this content.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="mb-4 h-24 w-full rounded-lg border border-dark-500 bg-dark-700 p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="rounded-lg bg-dark-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectReason.trim()}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
