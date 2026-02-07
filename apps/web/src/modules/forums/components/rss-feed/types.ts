/**
 * Types for RSS Feed Module
 */

export type FeedType = 'forum' | 'board' | 'thread' | 'user' | 'global';
export type FeedFormat = 'rss' | 'atom';

export interface RSSFeedButtonProps {
  /** The type of feed */
  feedType: FeedType;
  /** Forum slug for URL generation */
  forumSlug?: string;
  /** Category slug for URL generation */
  categorySlug?: string;
  /** Display variant */
  variant?: 'default' | 'minimal' | 'compact';
  /** Whether to show the label text */
  showLabel?: boolean;
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
  forumSlug?: string;
  categorySlug?: string;
  resourceId?: string;
  resourceName?: string;
  baseUrl?: string;
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
  selectedFormat: FeedFormat;
  onFormatChange: (format: FeedFormat) => void;
  format?: FeedFormat;
  onChange?: (format: FeedFormat) => void;
}

export interface RSSFeedLinkProps {
  feedType: FeedType;
  forumSlug?: string;
  categorySlug?: string;
  resourceId?: string;
  format?: FeedFormat;
  children?: React.ReactNode;
  className?: string;
  baseUrl?: string;
}
