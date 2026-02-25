import { describe, it, expect } from 'vitest';
import { generateSampleGifs } from '../utils';

describe('generateSampleGifs', () => {
  it('generates 20 GIFs', () => {
    const gifs = generateSampleGifs('funny');
    expect(gifs).toHaveLength(20);
  });

  it('includes query in titles', () => {
    const gifs = generateSampleGifs('cats');
    gifs.forEach((gif) => {
      expect(gif.title).toContain('cats');
    });
  });

  it('generates unique IDs', () => {
    const gifs = generateSampleGifs('test');
    const ids = new Set(gifs.map((g) => g.id));
    expect(ids.size).toBe(20);
  });

  it('uses "reaction" as default term', () => {
    const gifs = generateSampleGifs('');
    gifs.forEach((gif) => {
      expect(gif.title).toContain('reaction');
    });
  });

  it('each GIF has required properties', () => {
    const gifs = generateSampleGifs('test');
    gifs.forEach((gif) => {
      expect(gif.id).toBeDefined();
      expect(gif.title).toBeDefined();
      expect(gif.url).toBeDefined();
      expect(gif.previewUrl).toBeDefined();
      expect(gif.width).toBeGreaterThan(0);
      expect(gif.height).toBeGreaterThan(0);
      expect(gif.source).toBe('tenor');
    });
  });
});
