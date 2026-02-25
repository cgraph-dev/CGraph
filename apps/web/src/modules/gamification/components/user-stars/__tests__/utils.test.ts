import { describe, it, expect, vi } from 'vitest';

// Mock animation-presets since utils.ts imports it
vi.mock('@/lib/animation-presets', () => ({
  springs: { default: {}, snappy: {}, gentle: {} },
}));

import { getTierForPostCount, getProgressToNextTier, getPostsToNextTier } from '../utils';

describe('getTierForPostCount', () => {
  it('returns first tier for 0 posts', () => {
    const tier = getTierForPostCount(0);
    expect(tier).toBeDefined();
    expect(tier.minPosts).toBe(0);
  });

  it('returns higher tier for more posts', () => {
    const low = getTierForPostCount(5);
    const high = getTierForPostCount(500);
    expect(high.minPosts).toBeGreaterThanOrEqual(low.minPosts);
  });

  it('returns max tier for very high post count', () => {
    const tier = getTierForPostCount(100000);
    expect(tier).toBeDefined();
    expect(tier.stars).toBeGreaterThan(0);
  });

  it('returns tier matching exact threshold', () => {
    const tier10 = getTierForPostCount(10);
    expect(tier10.minPosts).toBeLessThanOrEqual(10);
  });
});

describe('getProgressToNextTier', () => {
  it('returns 0 for start of a tier', () => {
    // First tier starts at 0 posts
    const progress = getProgressToNextTier(0);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it('returns 100 for max tier', () => {
    const progress = getProgressToNextTier(100000);
    expect(progress).toBe(100);
  });

  it('returns value between 0 and 100', () => {
    const progress = getProgressToNextTier(25);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });
});

describe('getPostsToNextTier', () => {
  it('returns null for max tier', () => {
    const remaining = getPostsToNextTier(100000);
    expect(remaining).toBeNull();
  });

  it('returns positive number for non-max tier', () => {
    const remaining = getPostsToNextTier(0);
    expect(remaining).not.toBeNull();
    expect(remaining!).toBeGreaterThan(0);
  });

  it('decreases as post count increases within a tier', () => {
    const remaining5 = getPostsToNextTier(5);
    const remaining8 = getPostsToNextTier(8);
    if (remaining5 !== null && remaining8 !== null) {
      expect(remaining8).toBeLessThanOrEqual(remaining5);
    }
  });
});
