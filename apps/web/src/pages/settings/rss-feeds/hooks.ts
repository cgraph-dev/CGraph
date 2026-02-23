/**
 * RSS feed management hooks.
 * @module
 */
import { useMemo, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { RSSFeed, RecommendedApp } from './types';

const BASE_URL = window.location.origin;

export const RECOMMENDED_APPS: RecommendedApp[] = [
  { name: 'Feedly', url: 'https://feedly.com', platforms: ['Web', 'iOS', 'Android'] },
  { name: 'Inoreader', url: 'https://www.inoreader.com', platforms: ['Web', 'iOS', 'Android'] },
  {
    name: 'NetNewsWire',
    url: 'https://netnewswire.com',
    platforms: ['macOS', 'iOS'],
  },
  { name: 'Thunderbird', url: 'https://www.thunderbird.net', platforms: ['Desktop'] },
];

export function useRSSFeeds() {
  const { communityId, forumId } = useParams<{
    communityId?: string;
    forumId?: string;
  }>();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const feeds = useMemo<RSSFeed[]>(() => {
    const basePath = communityId ? `/api/v1/communities/${communityId}` : '/api/v1';
    const list: RSSFeed[] = [
      {
        id: 'all-posts',
        name: 'All Posts',
        description: 'Subscribe to all new posts in the community',
        url: `${BASE_URL}${basePath}/feeds/posts.rss`,
        icon: 'rss',
        color: 'orange',
      },
      {
        id: 'all-threads',
        name: 'All Threads',
        description: 'Subscribe to all new discussion threads',
        url: `${BASE_URL}${basePath}/feeds/threads.rss`,
        icon: 'message-square',
        color: 'blue',
      },
      {
        id: 'announcements',
        name: 'Announcements',
        description: 'Subscribe to community announcements only',
        url: `${BASE_URL}${basePath}/feeds/announcements.rss`,
        icon: 'megaphone',
        color: 'purple',
      },
    ];

    if (forumId) {
      list.push({
        id: `forum-${forumId}`,
        name: 'This Forum',
        description: 'Subscribe to posts in this specific forum',
        url: `${BASE_URL}${basePath}/forums/${forumId}/feed.rss`,
        icon: 'hash',
        color: 'emerald',
      });
    }

    return list;
  }, [communityId, forumId]);

  const copyUrl = useCallback(async (feed: RSSFeed) => {
    try {
      await navigator.clipboard.writeText(feed.url);
      setCopiedId(feed.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('textarea');
      input.value = feed.url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedId(feed.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const openUrl = useCallback((feed: RSSFeed) => {
    window.open(feed.url, '_blank', 'noopener,noreferrer');
  }, []);

  return { feeds, copiedId, copyUrl, openUrl };
}
