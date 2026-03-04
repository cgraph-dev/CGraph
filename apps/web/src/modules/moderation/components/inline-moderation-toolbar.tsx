/**
 * Inline content moderation toolbar.
 * @module
 */
import { useState } from 'react';
import {
  TrashIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';

const logger = createLogger('InlineModerationToolbar');
import { motion, AnimatePresence } from 'motion/react';
import { useModerationStore } from '@/modules/moderation/store';
import { useForumStore } from '@/modules/forums/store';
import { cn } from '@/lib/utils';

interface InlineModerationToolbarProps {
  forumId?: string;
  className?: string;
}

/**
 * InlineModerationToolbar - MyBB-style inline moderation for bulk actions
 *
 * Features:
 * - Select multiple threads/posts via checkboxes
 * - Bulk actions: delete, lock, pin, move, merge
 * - Appears as floating toolbar when items selected
 */
export default function InlineModerationToolbar({
  forumId,
  className = '',
}: InlineModerationToolbarProps) {
  const {
    bulkSelection,
    clearBulkSelection,
    bulkMoveThreads,
    bulkDeleteThreads,
    bulkLockThreads,
    bulkApproveThreads,
  } = useModerationStore();

  const { forums } = useForumStore();

  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const selectedCount = bulkSelection.threads.length + bulkSelection.posts.length;
  const hasThreads = bulkSelection.threads.length > 0;
  const hasPosts = bulkSelection.posts.length > 0;

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkDelete = async () => {
    if (confirmAction !== 'delete') {
      setConfirmAction('delete');
      return;
    }

    setIsLoading(true);
    try {
      await bulkDeleteThreads('Bulk deleted by moderator');
      setConfirmAction(null);
    } catch (error) {
      logger.error('Bulk delete failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkLock = async () => {
    setIsLoading(true);
    try {
      await bulkLockThreads();
    } catch (error) {
      logger.error('Bulk lock failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    setIsLoading(true);
    try {
      await bulkApproveThreads();
    } catch (error) {
      logger.error('Bulk approve failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkMove = async (targetForumId: string) => {
    setIsLoading(true);
    try {
      await bulkMoveThreads(targetForumId);
      setShowMoveDropdown(false);
    } catch (error) {
      logger.error('Bulk move failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
          'rounded-xl border border-dark-500 bg-white/[0.04] shadow-2xl',
          'p-4',
          className
        )}
      >
        <div className="flex items-center gap-4">
          {/* Selection count */}
          <div className="flex items-center gap-2 border-r border-dark-500 pr-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20">
              <span className="text-sm font-bold text-primary-400">{selectedCount}</span>
            </div>
            <div className="text-sm">
              <div className="font-medium text-white">Selected</div>
              <div className="text-xs text-gray-400">
                {hasThreads &&
                  `${bulkSelection.threads.length} thread${bulkSelection.threads.length > 1 ? 's' : ''}`}
                {hasThreads && hasPosts && ', '}
                {hasPosts &&
                  `${bulkSelection.posts.length} post${bulkSelection.posts.length > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Approve */}
            <button
              onClick={handleBulkApprove}
              disabled={isLoading}
              className="rounded-lg p-2 text-green-400 transition-colors hover:bg-green-500/20 hover:text-green-300"
              title="Approve selected"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>

            {/* Lock */}
            {hasThreads && (
              <button
                onClick={handleBulkLock}
                disabled={isLoading}
                className="rounded-lg p-2 text-yellow-400 transition-colors hover:bg-yellow-500/20 hover:text-yellow-300"
                title="Lock selected threads"
              >
                <LockClosedIcon className="h-5 w-5" />
              </button>
            )}

            {/* Move dropdown */}
            {hasThreads && (
              <div className="relative">
                <button
                  onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                  disabled={isLoading}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                  title="Move to forum"
                >
                  <ArrowRightIcon className="h-5 w-5" />
                  <span className="text-sm">Move</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {showMoveDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 max-h-60 w-64 overflow-y-auto rounded-lg border border-dark-500 bg-white/[0.06] shadow-xl">
                    <div className="border-b border-dark-500 p-2 text-xs text-gray-400">
                      Move to forum:
                    </div>
                    {forums
                      .filter((f) => f.id !== forumId)
                      .map((forum) => (
                        <button
                          key={forum.id}
                          onClick={() => handleBulkMove(forum.id)}
                          className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.10]"
                        >
                          {forum.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Delete */}
            {confirmAction === 'delete' ? (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-300">Confirm?</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                  className="rounded p-1 text-red-400 hover:bg-red-500/30"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="rounded p-1 text-gray-400 hover:bg-white/[0.10]"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                title="Delete selected"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Clear selection */}
          <button
            onClick={clearBulkSelection}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.10] hover:text-gray-200"
            title="Clear selection"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Moderation checkbox for individual items
 */
interface ModerationCheckboxProps {
  type: 'threads' | 'posts' | 'comments';
  id: string;
  className?: string;
}

/**
 * unknown for the moderation module.
 */
/**
 * Moderation Checkbox component.
 */
export function ModerationCheckbox({ type, id, className = '' }: ModerationCheckboxProps) {
  const { bulkSelection, toggleBulkSelection } = useModerationStore();

  const isSelected = bulkSelection[type].includes(id);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleBulkSelection(type, id);
      }}
      className={cn(
        'flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
        isSelected
          ? 'border-primary-500 bg-primary-500 text-white'
          : 'border-dark-400 hover:border-primary-400',
        className
      )}
    >
      {isSelected && <CheckIcon className="h-3 w-3" />}
    </button>
  );
}
