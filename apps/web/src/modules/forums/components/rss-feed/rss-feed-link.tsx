/**
 * RSS Feed Link Component
 *
 * Inline link for RSS feed subscription
 */

import { memo } from 'react';
import { RssIcon } from '@heroicons/react/24/outline';
import { buildFeedUrl } from './utils';
import type { RSSFeedLinkProps } from './types';

export const RSSFeedLink = memo(function RSSFeedLink({
  feedType,
  forumSlug,
  categorySlug,
  format = 'rss',
  className = '',
}: RSSFeedLinkProps) {
  const feedUrl = buildFeedUrl(feedType, format, forumSlug, categorySlug);

  return (
    <a
      href={feedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 ${className}`}
      title={`${format.toUpperCase()} Feed`}
    >
      <RssIcon className="h-4 w-4" />
      <span className="text-sm">{format.toUpperCase()}</span>
    </a>
  );
});
