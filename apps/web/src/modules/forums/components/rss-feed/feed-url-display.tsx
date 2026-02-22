/**
 * Feed URL Display Component
 *
 * Shows the feed URL with copy-to-clipboard functionality
 */

import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/shared/hooks';
import type { FeedUrlDisplayProps } from './types';

export const FeedUrlDisplay = memo(function FeedUrlDisplay({ url, format }: FeedUrlDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast?.({ type: 'success', message: 'Feed URL copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast?.({ type: 'error', message: 'Failed to copy URL' });
    }
  }, [url, showToast]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
      <div className="flex-1 overflow-hidden">
        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
          {format.toUpperCase()} Feed URL
        </div>
        <code className="block truncate text-sm text-gray-800 dark:text-gray-200">{url}</code>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className={`rounded-lg p-2 transition-colors ${
          copied
            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
            : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
        title="Copy to clipboard"
      >
        {copied ? <CheckIcon className="h-5 w-5" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
      </motion.button>
    </div>
  );
});
