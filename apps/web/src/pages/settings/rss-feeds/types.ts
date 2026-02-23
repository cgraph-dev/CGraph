/**
 * RSS feeds type definitions.
 * @module
 */
export interface RSSFeed {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: 'rss' | 'message-square' | 'megaphone' | 'hash';
  color: string;
}

export interface RecommendedApp {
  name: string;
  url: string;
  platforms: string[];
}
