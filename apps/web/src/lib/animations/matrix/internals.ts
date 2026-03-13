/**
 * Matrix Engine - Internal Utilities
 *
 * Pre-rendering infrastructure used by the MatrixEngine class:
 * - CharacterAtlas: Pre-rendered glyph cache with glow effects
 * - ObjectPool: Generic object recycling to eliminate GC pressure
 * - MorphState: Cipher morph animation state
 *
 * @version 2.0.0
 * @internal
 */

import type { MatrixTheme } from './types';
import { parseColor, toRGBA } from './themes';

// =============================================================================
// CONSTANTS
// =============================================================================

export const MIN_FRAME_TIME = 1000 / 240; // Allow up to 240fps for smoother interpolation
export const PERFORMANCE_SAMPLE_SIZE = 30; // Smaller sample for faster adaptation
export const CHARACTER_MORPH_PHASES = 8; // Phases in encrypt/decrypt cycle
export const MORPH_CHARS_PER_FRAME = 3; // Characters to morph per frame per column

// =============================================================================
// CHARACTER ATLAS - Pre-rendered glyphs for instant drawing
// =============================================================================

export interface CachedGlyph {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  width: number;
  height: number;
}

export interface CharacterAtlas {
  glyphs: Map<string, Map<string, CachedGlyph>>; // colorKey -> char -> glyph
  fontSize: number;
  fontFamily: string;
}

/**
 * Creates a high-performance character atlas with pre-rendered glyphs.
 * Eliminates per-frame text rendering overhead by pre-baking all glyph
 * variants (head, body segments, tail) with their glow effects.
 */
export function createCharacterAtlas(
  characters: string[],
  theme: MatrixTheme,
  fontSize: number,
  fontFamily: string,
  fontWeight: string
): CharacterAtlas {
  const atlas: CharacterAtlas = {
    glyphs: new Map(),
    fontSize,
    fontFamily,
  };

  // Color variants to pre-render: head, body segments, tail
  const colorVariants = [
    { key: 'head', color: theme.primaryColor, glow: true, glowIntensity: 1.0 },
    { key: 'head-bright', color: theme.primaryColor, glow: true, glowIntensity: 1.3, bright: true },
    { key: 'body-high', color: theme.primaryColor, glow: true, glowIntensity: 0.7 },
    { key: 'body-mid', color: theme.secondaryColor, glow: true, glowIntensity: 0.4 },
    { key: 'body-low', color: theme.secondaryColor, glow: false, glowIntensity: 0.2 },
    { key: 'tail', color: theme.tertiaryColor, glow: false, glowIntensity: 0 },
  ];

  const padding = Math.ceil(fontSize * 0.8); // Glow padding
  const glyphSize = fontSize + padding * 2;

  const supportsOffscreen = typeof OffscreenCanvas !== 'undefined';

  for (const variant of colorVariants) {
    const charMap = new Map<string, CachedGlyph>();

    for (const char of characters) {
      const canvas = supportsOffscreen
        ? new OffscreenCanvas(glyphSize, glyphSize)
        : document.createElement('canvas');

      if (!supportsOffscreen) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (canvas as HTMLCanvasElement).width = glyphSize; // safe downcast – DOM element

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (canvas as HTMLCanvasElement).height = glyphSize; // safe downcast – DOM element
      }

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const ctx = canvas.getContext('2d', { alpha: true }) as
        | CanvasRenderingContext2D
        | OffscreenCanvasRenderingContext2D;
      if (!ctx) continue;

      ctx.clearRect(0, 0, glyphSize, glyphSize);
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const rgb = parseColor(variant.color);
      const centerX = glyphSize / 2;
      const centerY = glyphSize / 2;

      // Render glow layers
      if (variant.glow && theme.glow.enabled) {
        const glowRadius = theme.glow.radius * variant.glowIntensity;

        // Outer soft glow
        ctx.shadowBlur = glowRadius * 2;
        ctx.shadowColor = toRGBA(rgb.r, rgb.g, rgb.b, 0.5 * variant.glowIntensity);
        ctx.fillStyle = toRGBA(rgb.r, rgb.g, rgb.b, 0.3);
        ctx.fillText(char, centerX, centerY);

        // Inner focused glow
        ctx.shadowBlur = glowRadius;
        ctx.shadowColor = toRGBA(rgb.r, rgb.g, rgb.b, 0.8 * variant.glowIntensity);
        ctx.fillStyle = toRGBA(rgb.r, rgb.g, rgb.b, 0.6);
        ctx.fillText(char, centerX, centerY);
      }

      // Main character (crisp)
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = variant.color;
      ctx.fillText(char, centerX, centerY);

      // Bright highlight for head
      if (variant.bright) {
        ctx.fillStyle = toRGBA(
          Math.min(255, rgb.r + 100),
          Math.min(255, rgb.g + 100),
          Math.min(255, rgb.b + 100),
          0.5
        );
        ctx.fillText(char, centerX, centerY);
      }

      charMap.set(char, { canvas, width: glyphSize, height: glyphSize });
    }

    atlas.glyphs.set(variant.key, charMap);
  }

  return atlas;
}

// =============================================================================
// OBJECT POOL - Eliminate garbage collection pressure
// =============================================================================

/**
 * Object Pool class.
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 100) {
    this.factory = factory;
    this.reset = reset;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /**
   * acquire for the animations module.
   * @returns The result.
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /**
   * release for the animations module.
   *
   * @param obj - The obj.
   * @returns The result.
   */
  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  /**
   * Resets to initial state.
   * @returns The result.
   */
  clear(): void {
    this.pool.length = 0;
  }
}

// =============================================================================
// CIPHER MORPH STATE
// =============================================================================

export interface MorphState {
  targetChar: string;
  currentChar: string;
  morphPhase: number; // 0 = stable, 1-N = morphing
  morphSpeed: number;
  isEncrypting: boolean;
}
