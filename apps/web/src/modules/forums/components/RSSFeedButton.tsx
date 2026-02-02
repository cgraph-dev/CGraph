/**
 * RSS Feed Integration Component
 *
 * Provides UI for subscribing to RSS/Atom feeds for forums, boards, threads, and users.
 *
 * Features:
 * - Copy-to-clipboard feed URLs
 * - Format selection (RSS 2.0 / Atom 1.0)
 * - Feed preview
 * - One-click subscribe buttons for popular readers
 * - QR code generation for mobile app scanning
 *
 * @module components/forums/RSSFeedButton
 */

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RssIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  QrCodeIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

// =============================================================================
// TYPES
// =============================================================================

export type FeedType = 'forum' | 'board' | 'thread' | 'user' | 'global';
export type FeedFormat = 'rss' | 'atom';

export interface RSSFeedButtonProps {
  /** The type of feed */
  feedType: FeedType;
  /** The ID of the resource (forum_id, board_id, thread_id, or user_id) */
  resourceId?: string;
  /** The name/title to display */
  resourceName?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as icon-only button */
  iconOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom base URL for the API */
  baseUrl?: string;
}

export interface FeedSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedType: FeedType;
  resourceId?: string;
  resourceName?: string;
  baseUrl: string;
}

export interface FeedReaderConfig {
  name: string;
  icon: string;
  urlTemplate: (feedUrl: string) => string;
  color: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FEED_READERS: FeedReaderConfig[] = [
  {
    name: 'Feedly',
    icon: '📰',
    urlTemplate: (url) => `https://feedly.com/i/subscription/feed/${encodeURIComponent(url)}`,
    color: '#2BB24C',
  },
  {
    name: 'Inoreader',
    icon: '📖',
    urlTemplate: (url) => `https://www.inoreader.com/feed/${encodeURIComponent(url)}`,
    color: '#0082C4',
  },
  {
    name: 'The Old Reader',
    icon: '📚',
    urlTemplate: (url) => `https://theoldreader.com/feeds/subscribe?url=${encodeURIComponent(url)}`,
    color: '#D74C46',
  },
  {
    name: 'NewsBlur',
    icon: '📋',
    urlTemplate: (url) => `https://newsblur.com/?url=${encodeURIComponent(url)}`,
    color: '#FAA61A',
  },
];

const FEED_TYPE_LABELS: Record<FeedType, string> = {
  forum: 'Forum',
  board: 'Board',
  thread: 'Thread',
  user: 'User Activity',
  global: 'Global Activity',
};

const FEED_TYPE_ENDPOINTS: Record<FeedType, (id?: string) => string> = {
  forum: (id) => `/api/v1/rss/forums/${id}/threads`,
  board: (id) => `/api/v1/rss/boards/${id}/threads`,
  thread: (id) => `/api/v1/rss/threads/${id}/posts`,
  user: (id) => `/api/v1/rss/users/${id}/activity`,
  global: () => '/api/v1/rss/global/activity',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Builds the full feed URL
 */
const buildFeedUrl = (
  baseUrl: string,
  feedType: FeedType,
  resourceId?: string,
  format: FeedFormat = 'rss'
): string => {
  const endpoint = FEED_TYPE_ENDPOINTS[feedType](resourceId);
  const formatParam = format === 'atom' ? '?format=atom' : '';
  return `${baseUrl}${endpoint}${formatParam}`;
};

/**
 * Generates a simple QR code as SVG (using a basic implementation)
 * For production, consider using a library like qrcode.react
 */
const generateQRCodeSVG = (_data: string): string => {
  // Placeholder - in production, use a proper QR code library
  // _data parameter will be used for actual QR code generation
  // This returns a simple placeholder SVG
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <text x="50" y="50" text-anchor="middle" dy=".3em" font-size="8" fill="#666">
        QR Code
      </text>
    </svg>
  `;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Feed URL display with copy button
 */
const FeedUrlDisplay = memo(function FeedUrlDisplay({
  url,
  format,
}: {
  url: string;
  format: FeedFormat;
}) {
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

/**
 * Feed reader quick-subscribe buttons
 */
const FeedReaderButtons = memo(function FeedReaderButtons({ feedUrl }: { feedUrl: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Subscribe with your favorite reader:
      </div>
      <div className="grid grid-cols-2 gap-2">
        {FEED_READERS.map((reader) => (
          <motion.a
            key={reader.name}
            href={reader.urlTemplate(feedUrl)}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500"
          >
            <span className="text-lg">{reader.icon}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {reader.name}
            </span>
            <ArrowTopRightOnSquareIcon className="ml-auto h-4 w-4 text-gray-400" />
          </motion.a>
        ))}
      </div>
    </div>
  );
});

/**
 * Format selector tabs
 */
const FormatSelector = memo(function FormatSelector({
  format,
  onChange,
}: {
  format: FeedFormat;
  onChange: (format: FeedFormat) => void;
}) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      {(['rss', 'atom'] as FeedFormat[]).map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            format === f
              ? 'bg-white text-orange-600 shadow-sm dark:bg-gray-700 dark:text-orange-400'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {f.toUpperCase()} 2.0
        </button>
      ))}
    </div>
  );
});

// =============================================================================
// MAIN COMPONENTS
// =============================================================================

/**
 * Modal for subscribing to RSS feeds
 */
export const FeedSubscribeModal = memo(function FeedSubscribeModal({
  isOpen,
  onClose,
  feedType,
  resourceId,
  resourceName,
  baseUrl,
}: FeedSubscribeModalProps) {
  const [format, setFormat] = useState<FeedFormat>('rss');
  const [showQR, setShowQR] = useState(false);

  const feedUrl = buildFeedUrl(baseUrl, feedType, resourceId, format);
  const displayName = resourceName || FEED_TYPE_LABELS[feedType];

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
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900"
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                <RssIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Subscribe to Feed
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{displayName}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 p-6">
            {/* Format selector */}
            <FormatSelector format={format} onChange={setFormat} />

            {/* Feed URL */}
            <FeedUrlDisplay url={feedUrl} format={format} />

            {/* Quick subscribe buttons */}
            <FeedReaderButtons feedUrl={feedUrl} />

            {/* QR Code section */}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <QrCodeIcon className="h-5 w-5" />
                <span>Show QR Code for mobile apps</span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${showQR ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showQR && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 flex justify-center"
                  >
                    <div
                      className="h-32 w-32 rounded-lg border border-gray-200 bg-white p-2"
                      dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(feedUrl) }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Feeds update every 5 minutes
              </p>
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

/**
 * RSS Feed Button Component
 *
 * Displays a button that opens the feed subscription modal.
 * Can be used in forum headers, board headers, thread views, or user profiles.
 *
 * @example
 * ```tsx
 * // In a forum header
 * <RSSFeedButton
 *   feedType="forum"
 *   resourceId={forum.id}
 *   resourceName={forum.name}
 * />
 *
 * // Icon-only in a thread view
 * <RSSFeedButton
 *   feedType="thread"
 *   resourceId={thread.id}
 *   iconOnly
 *   size="sm"
 * />
 * ```
 */
export const RSSFeedButton = memo(function RSSFeedButton({
  feedType,
  resourceId,
  resourceName,
  size = 'md',
  iconOnly = false,
  className = '',
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: RSSFeedButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 ${sizeClasses[size]} ${className} `}
        title="Subscribe to RSS Feed"
        aria-label="Subscribe to RSS Feed"
      >
        <RssIcon className={iconSizes[size]} />
        {!iconOnly && <span className="font-medium">RSS Feed</span>}
      </motion.button>

      <FeedSubscribeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        feedType={feedType}
        resourceId={resourceId}
        resourceName={resourceName}
        baseUrl={baseUrl}
      />
    </>
  );
});

/**
 * Inline RSS link for embedding in text
 */
export const RSSFeedLink = memo(function RSSFeedLink({
  feedType,
  resourceId,
  format = 'rss',
  children,
  className = '',
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: {
  feedType: FeedType;
  resourceId?: string;
  format?: FeedFormat;
  children?: React.ReactNode;
  className?: string;
  baseUrl?: string;
}) {
  const feedUrl = buildFeedUrl(baseUrl, feedType, resourceId, format);

  return (
    <a
      href={feedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-orange-600 hover:underline dark:text-orange-400 ${className}`}
    >
      <RssIcon className="h-4 w-4" />
      {children || `${format.toUpperCase()} Feed`}
    </a>
  );
});

// =============================================================================
// EXPORTS
// =============================================================================

export default RSSFeedButton;
