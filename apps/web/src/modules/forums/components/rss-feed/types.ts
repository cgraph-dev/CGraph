/**
 * Types for RSS Feed Module
 */

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

export interface FeedUrlDisplayProps {
  url: string;
  format: FeedFormat;
}

export interface FeedReaderButtonsProps {
  feedUrl: string;
}

export interface FormatSelectorProps {
  format: FeedFormat;
  onChange: (format: FeedFormat) => void;
}

export interface RSSFeedLinkProps {
  feedType: FeedType;
  resourceId?: string;
  format?: FeedFormat;
  children?: React.ReactNode;
  className?: string;
  baseUrl?: string;
}
