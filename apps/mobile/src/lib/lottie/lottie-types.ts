/**
 * Lottie Types — Mobile
 *
 * Shared type definitions for the mobile Lottie animation system.
 * Mirrors the web Lottie types for cross-platform consistency.
 *
 * @module lib/lottie/lottie-types
 */

/** Supported animation format for emojis and custom content */
export type AnimationFormat = 'gif' | 'apng' | 'webp' | 'lottie' | null;

/** CDN base URL for Noto emoji Lottie animations */
export const LOTTIE_CDN_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest';

/** Configuration for the Lottie renderer */
export interface LottieRendererProps {
  /** Unicode codepoint (e.g. "1f600" for 😀) */
  codepoint?: string;
  /** Direct URL to a Lottie JSON file */
  url?: string;
  /** Emoji character for deriving codepoint */
  emoji?: string;
  /** Display size in pixels */
  size?: number;
  /** Whether to start playing immediately */
  autoplay?: boolean;
  /** Whether to loop the animation */
  loop?: boolean;
  /** Fallback image source URI (WebP/PNG) */
  fallbackSrc?: string;
  /** Render mode hint */
  renderMode?: 'AUTOMATIC' | 'HARDWARE' | 'SOFTWARE';
}

/** Lottie animation source — either a file path or inline JSON object */
export type LottieSource = string | Record<string, unknown>;

/** Cache entry metadata */
export interface LottieCacheEntry {
  codepoint: string;
  filePath: string;
  sizeBytes: number;
  cachedAt: number;
  lastAccessedAt: number;
}

/**
 * Convert an emoji character to its Unicode codepoint(s) string.
 * e.g. "😀" → "1f600"
 */
export function emojiToCodepoint(emoji: string): string {
  const codePoints: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && cp !== 0xfe0f) {
      codePoints.push(cp.toString(16));
    }
  }
  return codePoints.join('_');
}

/**
 * Build the CDN URL for a Noto emoji Lottie JSON animation.
 */
export function getLottieCdnUrl(codepoint: string): string {
  return `${LOTTIE_CDN_BASE}/${codepoint}/lottie.json`;
}

/**
 * Build the CDN URL for a static WebP fallback.
 */
export function getWebPFallbackUrl(codepoint: string, size = 512): string {
  return `${LOTTIE_CDN_BASE}/${codepoint}/${size}.webp`;
}
