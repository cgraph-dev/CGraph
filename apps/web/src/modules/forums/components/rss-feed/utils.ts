/**
 * Utility functions for RSS Feed Module
 */

import type { FeedType, FeedFormat } from './types';
import { FEED_TYPE_ENDPOINTS } from './constants';

/**
 * Builds the full feed URL
 */
export function buildFeedUrl(
  feedTypeOrBaseUrl: FeedType | string,
  formatOrFeedType?: FeedFormat | FeedType,
  forumSlugOrResourceId?: string,
  categorySlug?: string
): string {
  // Support both calling conventions:
  // (feedType, format, forumSlug?, categorySlug?) — new convention
  // (baseUrl, feedType, resourceId?, format?) — legacy convention
  const isNewConvention = ['forum', 'board', 'thread', 'user', 'global'].includes(
    feedTypeOrBaseUrl
  );

  if (isNewConvention) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const feedType = feedTypeOrBaseUrl as FeedType; // safe downcast — validated by isNewConvention check

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const format = (formatOrFeedType as FeedFormat) ?? 'rss'; // safe downcast — caller convention
    const forumSlug = forumSlugOrResourceId;
    const parts = ['/api/v1/feeds', feedType];
    if (forumSlug) parts.push(forumSlug);
    if (categorySlug) parts.push(categorySlug);
    const formatParam = format === 'atom' ? '?format=atom' : '';
    return `${parts.join('/')}${formatParam}`;
  }

  // Legacy convention
  const baseUrl = feedTypeOrBaseUrl;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const feedType = (formatOrFeedType as FeedType) ?? 'global'; // safe downcast — legacy calling convention
  const resourceId = forumSlugOrResourceId;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const format: FeedFormat = (categorySlug as FeedFormat) ?? 'rss'; // safe downcast — legacy calling convention
  const endpoint = FEED_TYPE_ENDPOINTS[feedType](resourceId);
  const formatParam = format === 'atom' ? '?format=atom' : '';
  return `${baseUrl}${endpoint}${formatParam}`;
}

/**
 * Generates a simple QR code as SVG (placeholder)
 * For production, use a proper QR code library like qrcode.react
 */
export function generateQRCodeSVG(_data: string): string {
  return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <text x="50" y="50" text-anchor="middle" dy=".3em" font-size="8" fill="#666">
        QR Code
      </text>
    </svg>
  `;
}
