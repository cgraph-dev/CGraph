/**
 * Matrix Cipher Background Animation - Renderer Module
 *
 * @description Handles all canvas rendering operations for the Matrix rain effect.
 * Extracted from the monolithic MatrixEngine for separation of concerns.
 *
 * @version 1.0.0
 * @since v0.6.3
 */

import type { MatrixConfig, MatrixColumn, MatrixEngineState, DepthLayer } from './types';
import { parseColor, toRGBA } from './themes';
import type { CharacterAtlas, CachedGlyph } from './internals';

// =============================================================================
// RENDER QUEUE ITEM
// =============================================================================

export interface RenderQueueItem {
  glyph: CachedGlyph;
  x: number;
  y: number;
  alpha: number;
}

// =============================================================================
// MATRIX RENDERER CLASS
// =============================================================================

/**
 * Handles all rendering operations for the Matrix animation.
 *
 * Supports:
 * - Single-pass batch rendering with pre-computed glow textures
 * - Vignette and scanline post-processing effects
 * - Debug overlay rendering
 */
export class MatrixRenderer {
  private renderQueue: RenderQueueItem[] = [];

  /**
   * Main render function - Uses pre-rendered glyphs for maximum performance
   */
  render(
    ctx: CanvasRenderingContext2D,
    config: MatrixConfig,
    state: MatrixEngineState,
    atlas: CharacterAtlas,
    depthLayers: DepthLayer[],
    columnsByLayer: Map<number, MatrixColumn[]>,
    deltaTime: number,
    interpolation: number = 1
  ): void {
    const { width, height } = state.dimensions;
    const { theme, effects } = config;

    // Clear render queue
    this.renderQueue.length = 0;

    // Apply background fade (creates trail effect) - single draw call
    ctx.fillStyle = toRGBA(
      ...(Object.values(parseColor(theme.backgroundColor)) as [number, number, number]),
      effects.backgroundFade
    );
    ctx.fillRect(0, 0, width, height);

    // Build render queue from all layers (back to front)
    for (let i = depthLayers.length - 1; i >= 0; i--) {
      const columns = columnsByLayer.get(i) || [];
      const layer = depthLayers[i];

      if (layer) {
        this.buildLayerRenderQueue(columns, layer, interpolation, config, state, atlas, deltaTime);
      }
    }

    // Execute batched render
    this.executeBatchRender(ctx);

    // Post-processing effects (minimal overhead)
    if (effects.enableVignette) {
      this.renderVignette(ctx, state, config);
    }

    if (effects.enableScanlines) {
      this.renderScanlines(ctx, state, config);
    }

    // Debug overlay
    if (config.debug.showFPS) {
      this.renderDebugInfo(ctx, state);
    }
  }

  /**
   * Build render queue for a depth layer - prepares glyphs for batch drawing
   */
  private buildLayerRenderQueue(
    columns: MatrixColumn[],
    layer: DepthLayer,
    interpolation: number,
    config: MatrixConfig,
    state: MatrixEngineState,
    atlas: CharacterAtlas,
    deltaTime: number
  ): void {
    const glyphPadding = Math.ceil(config.font.baseSize * 0.8);

    columns.forEach((column) => {
      if (!column.active) return;

      // Interpolated Y position for smooth motion
      const interpolatedY =
        column.y +
        column.speed * config.effects.speedMultiplier * interpolation * (deltaTime / 1000) * 60;

      column.characters.forEach((char, i) => {
        const y = interpolatedY - i * column.fontSize;

        // Skip if off screen (with glow padding)
        if (y < -column.fontSize * 2 || y > state.dimensions.height + column.fontSize) {
          return;
        }

        // Determine glyph variant based on position and morph state
        let glyphKey: string;
        let alpha = column.opacityMod * layer.opacityMultiplier;

        const isMorphing = char.morphPhase > 0;
        const morphFlicker = isMorphing ? 0.7 + Math.random() * 0.3 : 1;

        if (char.isHead) {
          glyphKey = isMorphing ? 'head-bright' : 'head';
          alpha *= 1.0 * morphFlicker;
        } else if (i < column.length * 0.2) {
          glyphKey = isMorphing ? 'head' : 'body-high';
          alpha *= 0.95 * char.opacity * morphFlicker;
        } else if (i < column.length * 0.4) {
          glyphKey = 'body-mid';
          alpha *= 0.85 * char.opacity * morphFlicker;
        } else if (i < column.length * 0.7) {
          glyphKey = 'body-low';
          alpha *= 0.7 * char.opacity;
        } else {
          glyphKey = 'tail';
          alpha *= 0.5 * char.opacity;
        }

        // Get pre-rendered glyph from atlas
        const charMap = atlas.glyphs.get(glyphKey);
        const glyph = charMap?.get(char.value);

        if (glyph) {
          this.renderQueue.push({
            glyph,
            x: column.x - glyph.width / 2 + glyphPadding,
            y: y - glyphPadding,
            alpha: Math.min(1, Math.max(0, alpha)),
          });
        }
      });
    });
  }

  /**
   * Execute batched render with global alpha optimization
   */
  private executeBatchRender(ctx: CanvasRenderingContext2D): void {
    // Group by alpha for fewer state changes
    const alphaGroups = new Map<number, RenderQueueItem[]>();

    for (const item of this.renderQueue) {
      const alphaKey = Math.round(item.alpha * 20) / 20; // Quantize to 5% steps
      if (!alphaGroups.has(alphaKey)) {
        alphaGroups.set(alphaKey, []);
      }
      alphaGroups.get(alphaKey)!.push(item);
    }

    // Render each alpha group
    for (const [alpha, items] of alphaGroups) {
      ctx.globalAlpha = alpha;

      for (const item of items) {
        ctx.drawImage(item.glyph.canvas as CanvasImageSource, item.x, item.y);
      }
    }

    // Reset alpha
    ctx.globalAlpha = 1;
  }

  /**
   * Render vignette effect
   */
  private renderVignette(
    ctx: CanvasRenderingContext2D,
    state: MatrixEngineState,
    config: MatrixConfig
  ): void {
    const { width, height } = state.dimensions;
    const { vignetteIntensity } = config.effects;

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Render scanline effect
   */
  private renderScanlines(
    ctx: CanvasRenderingContext2D,
    state: MatrixEngineState,
    config: MatrixConfig
  ): void {
    const { width, height } = state.dimensions;
    const { scanlineOpacity } = config.effects;

    ctx.fillStyle = `rgba(0, 0, 0, ${scanlineOpacity})`;

    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }
  }

  /**
   * Render debug information
   */
  renderDebugInfo(ctx: CanvasRenderingContext2D, state: MatrixEngineState): void {
    const { fps, activeColumns, totalCharacters } = state.metrics;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 70);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#00ff41';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${fps}`, 20, 30);
    ctx.fillText(`Columns: ${activeColumns}`, 20, 50);
    ctx.fillText(`Characters: ${totalCharacters}`, 20, 70);
    ctx.restore();
  }
}
