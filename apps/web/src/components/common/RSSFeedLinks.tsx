import React from 'react';
import { RssIcon, LinkIcon, DocumentTextIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

/**
 * RSSFeedLinks Component
 * 
 * MyBB-style RSS feed links for forums, threads, etc.
 * Displays available RSS feeds with subscription options.
 */

interface RSSFeed {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'forum' | 'thread' | 'user' | 'search' | 'global';
}

interface RSSFeedLinksProps {
  feeds: RSSFeed[];
  showDescriptions?: boolean;
  compact?: boolean;
  className?: string;
}

export function RSSFeedLinks({
  feeds,
  showDescriptions = true,
  compact = false,
  className = '',
}: RSSFeedLinksProps) {
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <RssIcon className="w-4 h-4 text-orange-500" />
        {feeds.map((feed, index) => (
          <React.Fragment key={feed.id}>
            {index > 0 && <span className="text-gray-300">|</span>}
            <a
              href={feed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
            >
              {feed.title}
            </a>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <RssIcon className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">RSS Feeds</h3>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {feeds.map((feed) => (
          <div key={feed.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FeedTypeIcon type={feed.type} />
                  <a
                    href={feed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {feed.title}
                  </a>
                </div>
                {showDescriptions && feed.description && (
                  <p className="mt-1 text-sm text-gray-500">{feed.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(feed.url)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                  title="Copy feed URL"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <a
                  href={feed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                  Subscribe
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedTypeIcon({ type }: { type: RSSFeed['type'] }) {
  switch (type) {
    case 'forum':
      return <DocumentTextIcon className="w-4 h-4 text-blue-500" />;
    case 'thread':
      return <ChatBubbleLeftIcon className="w-4 h-4 text-green-500" />;
    case 'global':
      return <RssIcon className="w-4 h-4 text-orange-500" />;
    default:
      return <RssIcon className="w-4 h-4 text-gray-400" />;
  }
}

/**
 * RSSAutoDiscovery Component
 * 
 * Adds RSS autodiscovery link tags to the document head.
 * This helps RSS readers find feeds automatically.
 */
interface RSSAutoDiscoveryProps {
  feeds: { title: string; url: string }[];
}

export function RSSAutoDiscovery({ feeds }: RSSAutoDiscoveryProps) {
  React.useEffect(() => {
    // Remove any existing RSS links
    const existingLinks = document.querySelectorAll('link[type="application/rss+xml"]');
    existingLinks.forEach((link) => link.remove());

    // Add new RSS links
    feeds.forEach((feed) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.type = 'application/rss+xml';
      link.title = feed.title;
      link.href = feed.url;
      document.head.appendChild(link);
    });

    return () => {
      // Cleanup on unmount
      const links = document.querySelectorAll('link[type="application/rss+xml"]');
      links.forEach((link) => link.remove());
    };
  }, [feeds]);

  return null;
}

/**
 * ForumRSSButton Component
 * 
 * Simple RSS button for a specific forum/section.
 */
interface ForumRSSButtonProps {
  forumId: string;
  forumName: string;
  variant?: 'icon' | 'button' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ForumRSSButton({
  forumId,
  forumName,
  variant = 'icon',
  size = 'md',
  className = '',
}: ForumRSSButtonProps) {
  const feedUrl = `/api/v1/rss/forums/${forumId}`;
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'icon') {
    return (
      <a
        href={feedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors ${className}`}
        title={`RSS Feed for ${forumName}`}
      >
        <RssIcon className={sizeClasses[size]} />
      </a>
    );
  }

  if (variant === 'button') {
    return (
      <a
        href={feedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm ${className}`}
      >
        <RssIcon className="w-4 h-4" />
        <span>RSS</span>
      </a>
    );
  }

  return (
    <a
      href={feedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline text-sm ${className}`}
    >
      <RssIcon className={sizeClasses[size]} />
      <span>RSS Feed</span>
    </a>
  );
}

export default RSSFeedLinks;
