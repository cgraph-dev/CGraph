/**
 * Constants for RSS Feed Module
 */

import type { FeedType, FeedReaderConfig } from './types';

export const FEED_READERS: FeedReaderConfig[] = [
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

export const FEED_TYPE_LABELS: Record<FeedType, string> = {
  forum: 'Forum',
  board: 'Board',
  thread: 'Thread',
  user: 'User Activity',
  global: 'Global Activity',
};

export const FEED_TYPE_ENDPOINTS: Record<FeedType, (id?: string) => string> = {
  forum: (id) => `/api/v1/rss/forums/${id}/threads`,
  board: (id) => `/api/v1/rss/boards/${id}/threads`,
  thread: (id) => `/api/v1/rss/threads/${id}/posts`,
  user: (id) => `/api/v1/rss/users/${id}/activity`,
  global: () => '/api/v1/rss/global/activity',
};
