/**
 * QueueItemCard component
 * @module pages/forums/moderation-queue
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { QueueItemCardProps } from './types';
import { ITEM_TYPE_ICONS, PRIORITY_COLORS, REASON_LABELS } from './constants';

/**
 * unknown for the forums module.
 */
/**
 * Queue Item Card display component.
 */
export function QueueItemCard({
  item,
  isSelected,
  onSelect,
  onApprove,
  onReject,
}: QueueItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewOriginal = () => {
    if (item.itemType === 'thread') {
      window.open(`/forums/thread/${item.itemId}`, '_blank');
    } else if (item.itemType === 'post' || item.itemType === 'comment') {
      window.open(`/forums/post/${item.itemId}`, '_blank');
    } else if (item.itemType === 'user') {
      window.open(`/profile/${item.authorId}`, '_blank');
    }
  };

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
                  onClick={handleViewOriginal}
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
