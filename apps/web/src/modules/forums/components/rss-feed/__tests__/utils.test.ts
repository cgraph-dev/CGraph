import { describe, it, expect, vi } from 'vitest';

// Mock the constants module to provide FEED_TYPE_ENDPOINTS
vi.mock('../constants', () => ({
  FEED_TYPE_ENDPOINTS: {
    forum: (id?: string) => `/feeds/forum${id ? `/${id}` : ''}`,
    board: (id?: string) => `/feeds/board${id ? `/${id}` : ''}`,
    thread: (id?: string) => `/feeds/thread${id ? `/${id}` : ''}`,
    user: (id?: string) => `/feeds/user${id ? `/${id}` : ''}`,
    global: () => '/feeds/global',
  },
}));

import { buildFeedUrl, generateQRCodeSVG } from '../utils';

describe('buildFeedUrl', () => {
  describe('new convention (feedType, format, forumSlug, categorySlug)', () => {
    it('builds basic global feed URL', () => {
      const url = buildFeedUrl('global', 'rss');
      expect(url).toBe('/api/v1/feeds/global');
    });

    it('builds forum feed URL with slug', () => {
      const url = buildFeedUrl('forum', 'rss', 'general');
      expect(url).toBe('/api/v1/feeds/forum/general');
    });

    it('adds format=atom query param for atom format', () => {
      const url = buildFeedUrl('global', 'atom');
      expect(url).toContain('?format=atom');
    });

    it('does not add format param for rss', () => {
      const url = buildFeedUrl('global', 'rss');
      expect(url).not.toContain('?format=');
    });

    it('includes category slug when provided', () => {
      const url = buildFeedUrl('forum', 'rss', 'general', 'announcements');
      expect(url).toBe('/api/v1/feeds/forum/general/announcements');
    });
  });

  describe('legacy convention (baseUrl, feedType, resourceId, format)', () => {
    it('builds URL with base URL and feed type', () => {
      const url = buildFeedUrl('https://example.com', 'global');
      expect(url).toContain('https://example.com');
      expect(url).toContain('/feeds/global');
    });

    it('includes resource ID in legacy URL', () => {
      const url = buildFeedUrl('https://example.com', 'forum' as never, 'my-forum');
      expect(url).toContain('my-forum');
    });
  });
});

describe('generateQRCodeSVG', () => {
  it('returns a valid SVG string', () => {
    const svg = generateQRCodeSVG('https://example.com');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('contains QR Code text (placeholder)', () => {
    const svg = generateQRCodeSVG('https://example.com');
    expect(svg).toContain('QR Code');
  });
});
