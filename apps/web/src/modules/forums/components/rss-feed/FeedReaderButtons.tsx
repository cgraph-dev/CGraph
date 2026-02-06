/**
 * Feed Reader Buttons Component
 *
 * Quick-subscribe buttons for popular feed readers
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FEED_READERS } from './constants';
import type { FeedReaderButtonsProps } from './types';

export const FeedReaderButtons = memo(function FeedReaderButtons({
  feedUrl,
}: FeedReaderButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FEED_READERS.map((reader) => (
        <motion.a
          key={reader.name}
          href={reader.urlTemplate(feedUrl)}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded"
            style={{ backgroundColor: reader.color }}
          >
            <span className="text-sm font-bold text-white">{reader.name[0]}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {reader.name}
          </span>
        </motion.a>
      ))}
    </div>
  );
});
