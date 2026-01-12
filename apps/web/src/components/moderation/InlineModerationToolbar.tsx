import { useState } from 'react';
import { 
  TrashIcon, LockClosedIcon, ArrowRightIcon, CheckIcon, XMarkIcon,
  ExclamationTriangleIcon, CheckCircleIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useModerationStore } from '@/stores/moderationStore';
import { useForumStore } from '@/stores/forumStore';
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
  className = '' 
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
      console.error('Bulk delete failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkLock = async () => {
    setIsLoading(true);
    try {
      await bulkLockThreads();
    } catch (error) {
      console.error('Bulk lock failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    setIsLoading(true);
    try {
      await bulkApproveThreads();
    } catch (error) {
      console.error('Bulk approve failed:', error);
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
      console.error('Bulk move failed:', error);
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
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'bg-dark-800 border border-dark-500 rounded-xl shadow-2xl',
          'p-4',
          className
        )}
      >
        <div className="flex items-center gap-4">
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-4 border-r border-dark-500">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-400">{selectedCount}</span>
            </div>
            <div className="text-sm">
              <div className="font-medium text-white">Selected</div>
              <div className="text-xs text-gray-400">
                {hasThreads && `${bulkSelection.threads.length} thread${bulkSelection.threads.length > 1 ? 's' : ''}`}
                {hasThreads && hasPosts && ', '}
                {hasPosts && `${bulkSelection.posts.length} post${bulkSelection.posts.length > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Approve */}
            <button
              onClick={handleBulkApprove}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-colors"
              title="Approve selected"
            >
              <CheckCircleIcon className="w-5 h-5" />
            </button>

            {/* Lock */}
            {hasThreads && (
              <button
                onClick={handleBulkLock}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 transition-colors"
                title="Lock selected threads"
              >
                <LockClosedIcon className="w-5 h-5" />
              </button>
            )}

            {/* Move dropdown */}
            {hasThreads && (
              <div className="relative">
                <button
                  onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
                  title="Move to forum"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                  <span className="text-sm">Move</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                
                {showMoveDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-dark-700 border border-dark-500 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    <div className="p-2 text-xs text-gray-400 border-b border-dark-500">
                      Move to forum:
                    </div>
                    {forums
                      .filter(f => f.id !== forumId)
                      .map(forum => (
                        <button
                          key={forum.id}
                          onClick={() => handleBulkMove(forum.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-dark-600 transition-colors"
                        >
                          {forum.name}
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* Delete */}
            {confirmAction === 'delete' ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">Confirm?</span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                  className="p-1 rounded hover:bg-red-500/30 text-red-400"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="p-1 rounded hover:bg-dark-600 text-gray-400"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                title="Delete selected"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Clear selection */}
          <button
            onClick={clearBulkSelection}
            className="p-2 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
            title="Clear selection"
          >
            <XMarkIcon className="w-5 h-5" />
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
        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
        isSelected
          ? 'bg-primary-500 border-primary-500 text-white'
          : 'border-dark-400 hover:border-primary-400',
        className
      )}
    >
      {isSelected && <CheckIcon className="w-3 h-3" />}
    </button>
  );
}