/**
 * GifPicker Utilities
 *
 * Helper functions for GIF picker.
 */

import type { GifResult } from './types';

/**
 * Generate sample GIFs for demo/fallback
 */
export function generateSampleGifs(query: string): GifResult[] {
  const terms = query || 'reaction';
  return Array.from({ length: 20 }, (_, i) => ({
    id: `sample-${terms}-${i}`,
    title: `${terms} GIF ${i + 1}`,
    url: `https://media.tenor.com/images/sample${i % 10}.gif`,
    previewUrl: `https://media.tenor.com/images/sample${i % 10}_preview.gif`,
    width: 200 + (i % 3) * 50,
    height: 200 + ((i + 1) % 3) * 50,
    source: 'tenor' as const,
  }));
}
