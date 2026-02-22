/**
 * EditHistoryModal Component
 * Displays the edit history of a post or comment with diff view
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { useForumStore, type PostEditHistory } from '@/modules/forums/store';
import { formatTimeAgo } from '@/lib/utils';
import { GlassCard } from '@/shared/components/ui';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EditHistoryModal');

interface EditHistoryModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditHistoryModal({ postId, isOpen, onClose }: EditHistoryModalProps) {
  const { fetchEditHistory } = useForumStore();
  const [history, setHistory] = useState<PostEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState<PostEditHistory | null>(null);

  useEffect(() => {
    if (isOpen && postId) {
      loadHistory();
    }
  }, [isOpen, postId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEditHistory(postId);
      setHistory(data);
      if (data.length > 0) {
        setSelectedEdit(data[0] ?? null);
      }
    } catch (error) {
      logger.error('Failed to load edit history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-h-[80vh] w-full max-w-4xl overflow-hidden"
        >
          <GlassCard variant="frosted" className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-600 p-6">
              <h2 className="text-2xl font-bold text-white">Edit History</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:bg-dark-700"
              >
                <XMarkIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <ClockIcon className="mb-4 h-16 w-16 text-gray-500" />
                  <p className="text-gray-400">No edit history available</p>
                </div>
              ) : (
                <div className="flex h-full">
                  {/* Timeline Sidebar */}
                  <div className="w-64 overflow-y-auto border-r border-dark-600">
                    <div className="space-y-2 p-4">
                      {history.map((edit, index) => (
                        <button
                          key={edit.id}
                          onClick={() => setSelectedEdit(edit)}
                          className={`w-full rounded-lg p-3 text-left transition-colors ${
                            selectedEdit?.id === edit.id
                              ? 'border border-primary-500 bg-primary-500/20'
                              : 'border border-transparent bg-dark-700/50 hover:bg-dark-700'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span className="truncate text-sm font-medium text-white">
                              Edit #{history.length - index}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <UserIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{edit.editedByUsername}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatTimeAgo(edit.editedAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content View */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {selectedEdit && (
                      <motion.div
                        key={selectedEdit.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                        {/* Edit Info */}
                        <div className="flex items-center gap-4 border-b border-dark-600 pb-4">
                          <div className="flex-1">
                            <h3 className="mb-1 text-lg font-semibold text-white">
                              Edit #{history.findIndex((h) => h.id === selectedEdit.id) + 1}
                            </h3>
                            <p className="text-sm text-gray-400">
                              By {selectedEdit.editedByUsername} •{' '}
                              {formatTimeAgo(selectedEdit.editedAt)}
                            </p>
                          </div>
                        </div>

                        {/* Reason */}
                        {selectedEdit.reason && (
                          <div className="rounded-lg border border-dark-600 bg-dark-700/50 p-4">
                            <h4 className="mb-2 text-sm font-semibold text-gray-300">
                              Edit Reason
                            </h4>
                            <p className="text-sm text-gray-400">{selectedEdit.reason}</p>
                          </div>
                        )}

                        {/* Previous Content */}
                        <div className="rounded-lg border border-dark-600 bg-dark-700/50 p-4">
                          <h4 className="mb-2 text-sm font-semibold text-gray-300">
                            Previous Content
                          </h4>
                          <div className="prose prose-invert prose-sm max-w-none">
                            <p className="whitespace-pre-wrap text-gray-300">
                              {selectedEdit.previousContent}
                            </p>
                          </div>
                        </div>

                        {/* Diff View Note */}
                        <div className="rounded-lg border border-primary-500/30 bg-primary-500/10 p-4">
                          <p className="text-sm text-primary-400">
                            💡 Tip: Compare this with the current version to see what changed.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
