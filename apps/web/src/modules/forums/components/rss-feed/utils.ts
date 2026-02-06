/**
 * Utility functions for RSS Feed Module
 */

import type { FeedType, FeedFormat } from './types';
import { FEED_TYPE_ENDPOINTS } from './constants';

/**
 * Builds the full feed URL
 */
export function buildFeedUrl(
  baseUrl: string,
  feedType: FeedType,
  resourceId?: string,
  format: FeedFormat = 'rss'
): string {
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
