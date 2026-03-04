/**
 * Post Quote Button
 *
 * "Add to quote" button that appears on each post in a thread.
 * Toggles the post in/out of the multi-quote buffer.
 *
 * Follows Discord's "Reply" button pattern — small action icon
 * that appears in the post action bar.
 *
 * @module modules/forums/components
 */

import { useCallback, memo } from 'react';
import { motion } from 'motion/react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftIcon as ChatBubbleSolidIcon } from '@heroicons/react/24/solid';
import { useForumStore } from '@/modules/forums/store';

interface PostQuoteButtonProps {
  postId: string;
  /** Optional label. Defaults to icon-only with tooltip. */
  showLabel?: boolean;
  className?: string;
}

export const PostQuoteButton = memo(function PostQuoteButton({
  postId,
  showLabel = false,
  className = '',
}: PostQuoteButtonProps) {
  const multiQuoteBuffer = useForumStore((s) => s.multiQuoteBuffer);
  const addToMultiQuote = useForumStore((s) => s.addToMultiQuote);
  const removeFromMultiQuote = useForumStore((s) => s.removeFromMultiQuote);

  const isSelected = multiQuoteBuffer.includes(postId);

  const handleToggle = useCallback(() => {
    if (isSelected) {
      removeFromMultiQuote(postId);
    } else {
      addToMultiQuote(postId);
    }
  }, [isSelected, postId, addToMultiQuote, removeFromMultiQuote]);

  const Icon = isSelected ? ChatBubbleSolidIcon : ChatBubbleLeftIcon;

  return (
    <motion.button
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isSelected ? 'Remove from multi-quote' : 'Add to multi-quote'}
      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors ${
        isSelected
          ? 'bg-primary-600/20 text-primary-400'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      } ${className}`}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span className="hidden sm:inline">{isSelected ? 'Quoted' : 'Quote'}</span>}
      {isSelected && (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
          ✓
        </span>
      )}
    </motion.button>
  );
});
