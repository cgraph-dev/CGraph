/**
 * Feed Subscribe Modal Component
 *
 * Modal for subscribing to RSS/Atom feeds with QR code display
 */

import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import { XMarkIcon, QrCodeIcon, RssIcon } from '@heroicons/react/24/outline';
import { FeedUrlDisplay } from './feed-url-display';
import { FeedReaderButtons } from './feed-reader-buttons';
import { FormatSelector } from './format-selector';
import { buildFeedUrl, generateQRCodeSVG } from './utils';
import { FEED_TYPE_LABELS } from './constants';
import type { FeedSubscribeModalProps, FeedFormat } from './types';

export const FeedSubscribeModal = memo(function FeedSubscribeModal({
  isOpen,
  onClose,
  feedType,
  forumSlug,
  categorySlug,
}: FeedSubscribeModalProps) {
  const [format, setFormat] = useState<FeedFormat>('rss');
  const [showQR, setShowQR] = useState(false);

  const feedUrl = useMemo(
    () => buildFeedUrl(feedType, format, forumSlug, categorySlug),
    [feedType, format, forumSlug, categorySlug]
  );

  const qrCodeSVG = useMemo(() => (showQR ? generateQRCodeSVG(feedUrl) : ''), [showQR, feedUrl]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900"
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RssIcon className="h-6 w-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Subscribe to {FEED_TYPE_LABELS[feedType]}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Format Selector */}
          <div className="mb-4">
            <FormatSelector selectedFormat={format} onFormatChange={setFormat} />
          </div>

          {/* Feed URL Display */}
          <div className="mb-4">
            <FeedUrlDisplay url={feedUrl} format={format} />
          </div>

          {/* Quick Subscribe */}
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick Subscribe
            </h3>
            <FeedReaderButtons feedUrl={feedUrl} />
          </div>

          {/* QR Code Toggle */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <QrCodeIcon className="h-5 w-5" />
              {showQR ? 'Hide' : 'Show'} QR Code
            </button>

            {showQR && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 flex justify-center"
              >
                <div
                  className="rounded-lg bg-white p-4"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(qrCodeSVG, {
                      USE_PROFILES: { svg: true, svgFilters: true },
                    }),
                  }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
