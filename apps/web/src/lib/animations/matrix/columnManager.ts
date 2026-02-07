/**
 * Matrix Cipher Background Animation - Column Manager Module
 *
 * @description Manages column lifecycle: creation, updating, and recycling.
 * Extracted from the monolithic MatrixEngine for separation of concerns.
 *
 * @version 1.0.0
 * @since v0.6.3
 */

import type {
  MatrixConfig,
  MatrixColumn,
  MatrixCharacter,
  MatrixEngineState,
  DepthLayer,
} from './types';
import { getRandomChar } from './characters';
import { CHARACTER_MORPH_PHASES, MORPH_CHARS_PER_FRAME } from './internals';

// =============================================================================
// COLUMN MANAGER CLASS
// =============================================================================

/**
 * Manages the lifecycle of Matrix rain columns.
 *
 * Handles:
 * - Column initialization across depth layers
 * - Column creation with randomized parameters
 * - Per-frame column updates with cipher morphing
 * - Column recycling / respawning
 */
export class ColumnManager {
  /**
   * Initialize all columns across depth layers
   */
  initializeColumns(
    config: MatrixConfig,
    state: MatrixEngineState,
    depthLayers: DepthLayer[],
    columnsByLayer: Map<number, MatrixColumn[]>,
    characters: string[]
  ): void {
    const { width, height } = state.dimensions;

    // If dimensions are 0, skip initialization
    if (width === 0 || height === 0) {
      return;
    }

    const { columns: colConfig, effects, performance: perfConfig } = config;

    // Calculate total columns based on density
    const maxPossibleColumns = Math.floor(width / colConfig.spacing);
    const targetColumns = Math.min(
      Math.floor(maxPossibleColumns * colConfig.density),
      perfConfig.maxColumns
    );

    // Distribute columns across depth layers
    const columnsPerLayer = Math.ceil(targetColumns / effects.depthLayers);

    columnsByLayer.forEach((columns, layerIndex) => {
      columns.length = 0;
      const layer = depthLayers[layerIndex];

      if (!layer) return; // Skip if layer doesn't exist

      for (let i = 0; i < columnsPerLayer; i++) {
        const column = this.createColumn(
          layerIndex,
          i,
          columnsPerLayer,
          config,
          state,
          depthLayers,
          characters
        );
        columns.push(column);
      }

      layer.columnCount = columns.length;
    });

    // Update state
    state.columns = Array.from(columnsByLayer.values()).flat();
    state.metrics.activeColumns = state.columns.length;
  }

  /**
   * Create a single column
   */
  createColumn(
    layerIndex: number,
    columnIndex: number,
    totalInLayer: number,
    config: MatrixConfig,
    state: MatrixEngineState,
    depthLayers: DepthLayer[],
    characters: string[]
  ): MatrixColumn {
    const { width, height } = state.dimensions;
    const { columns: colConfig, font } = config;
    const layer = depthLayers[layerIndex];

    // Default multipliers if layer is undefined
    const speedMultiplier = layer?.speedMultiplier ?? 1;
    const sizeMultiplier = layer?.sizeMultiplier ?? 1;

    // Calculate X position with some randomness
    const baseX = (columnIndex / totalInLayer) * width;
    const xVariation = (Math.random() - 0.5) * colConfig.spacing;
    const x = baseX + xVariation;

    // Calculate speed with layer adjustment
    const baseSpeed =
      colConfig.minSpeed + Math.random() * (colConfig.maxSpeed - colConfig.minSpeed);
    const speed = baseSpeed * speedMultiplier;

    // Calculate column length
    const length = Math.floor(
      colConfig.minLength + Math.random() * (colConfig.maxLength - colConfig.minLength)
    );

    // Initial Y position (can be offscreen for stagger effect)
    const y = colConfig.randomizeStart
      ? Math.random() * height * 2 - height
      : -length * font.baseSize;

    // Font size variation
    const fontSize = font.sizeVariation
      ? font.minSize + Math.random() * (font.maxSize - font.minSize)
      : font.baseSize;

    return {
      index: columnIndex,
      x: Math.round(x),
      y,
      speed,
      length,
      characters: this.createCharacters(length, config, characters),
      active: true,
      depth: layerIndex,
      opacityMod: 0.7 + Math.random() * 0.3,
      frameCount: 0,
      respawnDelay: 0,
      fontSize: fontSize * sizeMultiplier,
    };
  }

  /**
   * Create characters for a column with morph state
   */
  private createCharacters(
    length: number,
    config: MatrixConfig,
    characters: string[]
  ): MatrixCharacter[] {
    const { characters: charConfig } = config;

    return Array.from({ length }, (_, i) => ({
      value: getRandomChar(characters),
      opacity: 1 - i / length,
      isHead: i === 0,
      brightness: i === 0 ? 1.2 : 1 - (i / length) * 0.5,
      age: 0,
      changeTimer: Math.floor(
        charConfig.minChangeInterval +
          Math.random() * (charConfig.maxChangeInterval - charConfig.minChangeInterval)
      ),
      scale: 0.9 + Math.random() * 0.2,
      morphPhase: 0,
      morphTarget: '',
      isEncrypting: Math.random() > 0.5,
    }));
  }

  /**
   * Update a single column with delta-time scaling
   */
  updateColumn(
    column: MatrixColumn,
    config: MatrixConfig,
    state: MatrixEngineState,
    depthLayers: DepthLayer[],
    characters: string[],
    speedScale: number = 1
  ): void {
    const { height } = state.dimensions;
    const { columns: colConfig, characters: charConfig } = config;

    if (!column.active) {
      // Handle respawn delay
      column.respawnDelay -= speedScale;
      if (column.respawnDelay <= 0) {
        this.respawnColumn(column, config, state, depthLayers, characters);
      }
      return;
    }

    // Move column down with speed scaling
    column.y += column.speed * config.effects.speedMultiplier * speedScale;
    column.frameCount++;

    // Update characters with cipher morphing
    const morphCount = Math.ceil(MORPH_CHARS_PER_FRAME * speedScale);
    let morphed = 0;

    column.characters.forEach((char, i) => {
      char.age += speedScale;

      // Continuous cipher morph animation
      if (char.morphPhase > 0) {
        char.morphPhase -= speedScale * 0.5;
        if (char.morphPhase <= 0) {
          char.morphPhase = 0;
          char.value = char.morphTarget || char.value;
          char.isEncrypting = !char.isEncrypting;
          // Queue next morph cycle
          char.changeTimer = Math.floor(
            charConfig.minChangeInterval +
              Math.random() * (charConfig.maxChangeInterval - charConfig.minChangeInterval)
          );
        } else {
          // Show scrambled character during morph
          char.value = getRandomChar(characters);
        }
      } else if (char.changeTimer > 0) {
        char.changeTimer -= speedScale;
      } else if (morphed < morphCount && Math.random() < charConfig.changeFrequency * 2) {
        // Start morph cycle
        char.morphTarget = getRandomChar(characters);
        char.morphPhase = CHARACTER_MORPH_PHASES;
        morphed++;
      }

      // Update opacity based on position in column
      const normalizedPosition = i / column.length;
      char.opacity = Math.max(0.1, 1 - normalizedPosition * 0.9);
    });

    // Check if column is off screen
    const columnHeight = column.length * column.fontSize;
    if (column.y - columnHeight > height) {
      column.active = false;
      column.respawnDelay = Math.floor(
        colConfig.minRespawnDelay +
          Math.random() * (colConfig.maxRespawnDelay - colConfig.minRespawnDelay)
      );
    }
  }

  /**
   * Respawn a column at the top
   */
  private respawnColumn(
    column: MatrixColumn,
    config: MatrixConfig,
    state: MatrixEngineState,
    depthLayers: DepthLayer[],
    characters: string[]
  ): void {
    const { width } = state.dimensions;
    const { columns: colConfig } = config;
    const layer = depthLayers[column.depth];

    // Default speed multiplier if layer is undefined
    const speedMultiplier = layer?.speedMultiplier ?? 1;

    // New random X position
    const xVariation = (Math.random() - 0.5) * colConfig.spacing * 3;
    column.x = Math.max(0, Math.min(width, column.x + xVariation));

    // Reset position above screen
    column.y = -column.length * column.fontSize * (1 + Math.random());

    // New speed
    const baseSpeed =
      colConfig.minSpeed + Math.random() * (colConfig.maxSpeed - colConfig.minSpeed);
    column.speed = baseSpeed * speedMultiplier;

    // New length
    column.length = Math.floor(
      colConfig.minLength + Math.random() * (colConfig.maxLength - colConfig.minLength)
    );

    // Regenerate characters
    column.characters = this.createCharacters(column.length, config, characters);
    column.active = true;
    column.frameCount = 0;
    column.opacityMod = 0.7 + Math.random() * 0.3;
  }
}
