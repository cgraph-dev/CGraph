/**
 * RSS Feed Button - Re-export from modularized module
 *
 * @module forums/components/RSSFeedButton
 * @see ./rss-feed for implementation
 */

export {
  RSSFeedButton,
  RSSFeedLink,
  FeedSubscribeModal,
  FEED_READERS,
  FEED_TYPE_LABELS,
  FEED_TYPE_ENDPOINTS,
  buildFeedUrl,
} from './rss-feed';

export type {
  FeedType,
  FeedFormat,
  RSSFeedButtonProps,
  RSSFeedLinkProps,
  FeedSubscribeModalProps,
} from './rss-feed';
