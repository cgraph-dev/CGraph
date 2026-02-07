/**
 * MultiQuoteIndicator Component
 * Floating indicator showing selected posts for multi-quote reply
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useForumStore } from '@/modules/forums/store';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { GlassCard } from '@/shared/components/ui';

interface MultiQuoteIndicatorProps {
  onQuoteClick: () => void;
}

export default function MultiQuoteIndicator({ onQuoteClick }: MultiQuoteIndicatorProps) {
  const { multiQuoteBuffer, removeFromMultiQuote, clearMultiQuote } = useForumStore();

  if (multiQuoteBuffer.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <GlassCard variant="frosted" className="p-4 shadow-2xl">
          <div className="flex items-center gap-4">
            {/* Icon & Count */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <ChatBubbleLeftIcon className="h-6 w-6 text-primary-400" />
                <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                  <span className="text-xs font-bold text-white">{multiQuoteBuffer.length}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {multiQuoteBuffer.length} {multiQuoteBuffer.length === 1 ? 'post' : 'posts'}{' '}
                  selected
                </p>
                <p className="text-xs text-gray-400">Click to reply with quotes</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => {
                  HapticFeedback.medium();
                  onQuoteClick();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:from-primary-500 hover:to-purple-500"
              >
                Quote & Reply
              </motion.button>

              <motion.button
                onClick={() => {
                  HapticFeedback.light();
                  clearMultiQuote();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-dark-700 p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                title="Clear selection"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Selected Posts Preview */}
          {multiQuoteBuffer.length > 0 && (
            <div className="mt-3 max-h-32 space-y-1 overflow-y-auto border-t border-dark-600 pt-3">
              {multiQuoteBuffer.map((postId) => (
                <div
                  key={postId}
                  className="flex items-center justify-between gap-2 rounded bg-dark-700/50 px-2 py-1.5"
                >
                  <span className="truncate text-xs text-gray-400">
                    Post ID: {postId.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => {
                      HapticFeedback.light();
                      removeFromMultiQuote(postId);
                    }}
                    className="text-gray-500 transition-colors hover:text-red-400"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
