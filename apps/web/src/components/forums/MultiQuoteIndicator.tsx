/**
 * MultiQuoteIndicator Component
 * Floating indicator showing selected posts for multi-quote reply
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useForumStore } from '@/stores/forumStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import GlassCard from '@/components/ui/GlassCard';

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
                <div className="absolute -top-2 -right-2 h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{multiQuoteBuffer.length}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {multiQuoteBuffer.length} {multiQuoteBuffer.length === 1 ? 'post' : 'posts'} selected
                </p>
                <p className="text-xs text-gray-400">
                  Click to reply with quotes
                </p>
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
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-500/20"
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
                className="p-2 bg-dark-700 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                title="Clear selection"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Selected Posts Preview */}
          {multiQuoteBuffer.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dark-600 space-y-1 max-h-32 overflow-y-auto">
              {multiQuoteBuffer.map((postId) => (
                <div
                  key={postId}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 bg-dark-700/50 rounded"
                >
                  <span className="text-xs text-gray-400 truncate">
                    Post ID: {postId.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => {
                      HapticFeedback.light();
                      removeFromMultiQuote(postId);
                    }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
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
