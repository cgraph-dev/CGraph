/**
 * TypeScript types for Lottie animation integration.
 *
 * Covers Lottie animation data structures, animated emoji metadata,
 * and configuration options for the LottieRenderer component.
 *
 * @module lib/lottie/lottie-types
 */

// ── Lottie Animation Data ──────────────────────────────────────────

/** Raw Lottie JSON animation data structure. */
export interface LottieAnimationData {
  /** Lottie format version. */
  v: string;
  /** Frame rate. */
  fr: number;
  /** In-point (first frame). */
  ip: number;
  /** Out-point (last frame). */
  op: number;
  /** Canvas width. */
  w: number;
  /** Canvas height. */
  h: number;
  /** Animation layers. */
  layers: unknown[];
  /** Embedded assets (images, precomps). */
  assets?: unknown[];
}

// ── Animated Emoji ─────────────────────────────────────────────────

/** Metadata for a single animated Noto emoji from the catalog. */
export interface AnimatedEmojiMeta {
  /** Unicode codepoint (hex string, e.g. "1f600"). */
  codepoint: string;
  /** The emoji character. */
  emoji: string;
  /** Human-readable name. */
  name: string;
  /** Category grouping. */
  category: string;
  /** CDN URLs for different formats. */
  animations: {
    /** URL to lottie.json animation file. */
    lottie: string;
    /** URL to 512.webp static fallback. */
    webp: string;
    /** URL to 512.gif animated fallback. */
    gif: string;
  };
  /** Whether this emoji has a Lottie animation available. */
  hasAnimation: boolean;
}

// ── Lottie Configuration ───────────────────────────────────────────

/** Configuration for the LottieRenderer component. */
export interface LottieConfig {
  /** Start playing immediately. */
  autoplay?: boolean;
  /** Loop the animation continuously. */
  loop?: boolean;
  /** Play animation on mouse hover, pause on leave. */
  playOnHover?: boolean;
  /** Respect prefers-reduced-motion media query. */
  reducedMotion?: boolean;
  /** Rendering engine to use. */
  renderer?: 'svg' | 'canvas' | 'html';
  /** Quality preset (low=canvas, medium=svg, high=html). */
  quality?: 'low' | 'medium' | 'high';
}

// ── LottieRenderer Props ───────────────────────────────────────────

/** Props for the LottieRenderer component. */
export interface LottieRendererProps {
  /** Unicode codepoint for the emoji animation. */
  codepoint: string;
  /** The emoji character (used for alt text). */
  emoji: string;
  /** Render size in px. @default 32 */
  size?: number;
  /** Start playing immediately. @default false */
  autoplay?: boolean;
  /** Loop the animation. @default false */
  loop?: boolean;
  /** Play on hover, pause on leave. @default true */
  playOnHover?: boolean;
  /** Replay animation from start every N milliseconds. 0 = disabled. @default 0 */
  replayInterval?: number;
  /** Additional CSS class names. */
  className?: string;
  /** WebP fallback URL for reduced motion / load failure. */
  fallbackSrc?: string;
  /** Optional raw Lottie JSON data (for custom/uploaded emojis). */
  animationData?: Record<string, unknown>;
}

// ── Cache Types ────────────────────────────────────────────────────

/** Entry stored in IndexedDB cache. */
export interface LottieCacheEntry {
  codepoint: string;
  data: LottieAnimationData;
  /** When this entry was last accessed (LRU). */
  lastAccessed: number;
  /** Approximate size in bytes. */
  sizeEstimate: number;
}
