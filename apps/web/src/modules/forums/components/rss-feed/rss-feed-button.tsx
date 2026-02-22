/**
 * RSS Feed Button Component
 *
 * Button that opens the feed subscription modal
 */

import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { RssIcon } from '@heroicons/react/24/outline';
import { FeedSubscribeModal } from './feed-subscribe-modal';
import type { RSSFeedButtonProps } from './types';

export const RSSFeedButton = memo(function RSSFeedButton({
  feedType,
  forumSlug,
  categorySlug,
  variant = 'default',
  showLabel = true,
}: RSSFeedButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = useCallback(() => setIsModalOpen(true), []);
  const handleClose = useCallback(() => setIsModalOpen(false), []);

  const baseStyles = 'inline-flex items-center gap-2 rounded-lg font-medium transition-colors';

  const variantStyles = {
    default:
      'bg-orange-100 px-3 py-2 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50',
    minimal:
      'p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
    compact:
      'bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className={`${baseStyles} ${variantStyles[variant]}`}
        title="Subscribe via RSS"
      >
        <RssIcon className={variant === 'compact' ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
        {showLabel && variant !== 'minimal' && (
          <span className={variant === 'compact' ? 'text-xs' : 'text-sm'}>RSS</span>
        )}
      </motion.button>

      <FeedSubscribeModal
        isOpen={isModalOpen}
        onClose={handleClose}
        feedType={feedType}
        forumSlug={forumSlug}
        categorySlug={categorySlug}
      />
    </>
  );
});
