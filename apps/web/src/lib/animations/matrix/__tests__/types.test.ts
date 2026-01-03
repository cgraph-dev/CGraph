/**
 * Matrix Animation System - Type Tests
 * 
 * @description Tests for TypeScript type definitions and type utilities
 * @version 1.0.0
 * @since v0.6.3
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  MatrixConfig,
  MatrixTheme,
  MatrixColumn,
  MatrixCharacter,
  MatrixEngineState,
  DepthLayer,
  DeepPartial,
  CharacterSetType,
  ThemePreset,
  AnimationState,
  PerformanceConfig,
  ColumnConfig,
  EffectsConfig,
  FontConfig,
  CharacterSetConfig,
} from '../types';

// =============================================================================
// TYPE STRUCTURE TESTS
// =============================================================================

describe('Matrix Animation Types', () => {
  describe('DeepPartial Type Utility', () => {
    it('should make all nested properties optional', () => {
      type TestType = {
        a: string;
        b: {
          c: number;
          d: {
            e: boolean;
          };
        };
      };
      
      type DeepPartialTest = DeepPartial<TestType>;
      
      // This should compile - all properties are optional
      const test: DeepPartialTest = {};
      const test2: DeepPartialTest = { a: 'hello' };
      const test3: DeepPartialTest = { b: { c: 5 } };
      const test4: DeepPartialTest = { b: { d: { e: true } } };
      
      expect(test).toBeDefined();
      expect(test2.a).toBe('hello');
      expect(test3.b?.c).toBe(5);
      expect(test4.b?.d?.e).toBe(true);
    });
  });

  describe('CharacterSetType', () => {
    it('should include all valid character set types', () => {
      const validTypes: CharacterSetType[] = [
        'latin',
        'katakana',
        'cyrillic',
        'greek',
        'numbers',
        'symbols',
        'binary',
        'hex',
        'mixed',
        'custom',
      ];
      
      expect(validTypes).toHaveLength(10);
    });
  });

  describe('ThemePreset', () => {
    it('should include all valid theme presets', () => {
      const validPresets: ThemePreset[] = [
        'matrix-green',
        'cyber-blue',
        'blood-red',
        'golden',
        'purple-haze',
        'neon-pink',
        'ice',
        'fire',
        'custom',
      ];
      
      expect(validPresets).toHaveLength(9);
    });
  });

  describe('AnimationState', () => {
    it('should include all valid animation states', () => {
      const validStates: AnimationState[] = [
        'idle',
        'running',
        'paused',
        'stopped',
      ];
      
      expect(validStates).toHaveLength(4);
    });
  });

  describe('MatrixTheme', () => {
    it('should require all color properties', () => {
      const validTheme: MatrixTheme = {
        id: 'test-theme',
        name: 'Test Theme',
        primaryColor: '#00ff00',
        secondaryColor: '#008800',
        headColor: '#ffffff',
        trailColors: ['#00cc00', '#009900', '#006600'],
        backgroundColor: '#000000',
        glowColor: '#00ff00',
        glowIntensity: 0.5,
        fontWeight: 400,
        characterSet: 'mixed',
      };
      
      expect(validTheme.id).toBe('test-theme');
      expect(validTheme.trailColors).toHaveLength(3);
    });
  });

  describe('MatrixColumn', () => {
    it('should have all required properties', () => {
      const column: MatrixColumn = {
        index: 0,
        x: 100,
        y: 50,
        speed: 1.5,
        length: 20,
        characters: [],
        active: true,
        depth: 0,
        opacityMod: 1.0,
        frameCount: 0,
        respawnDelay: 0,
        fontSize: 16,
      };
      
      expect(column.index).toBe(0);
      expect(column.active).toBe(true);
      expect(column.depth).toBe(0);
    });
  });

  describe('MatrixCharacter', () => {
    it('should have all required properties', () => {
      const character: MatrixCharacter = {
        value: 'A',
        opacity: 1.0,
        isHead: false,
        brightness: 1.0,
        age: 0,
        changeCounter: 0,
      };
      
      expect(character.value).toBe('A');
      expect(character.isHead).toBe(false);
    });
  });

  describe('DepthLayer', () => {
    it('should have all required properties', () => {
      const layer: DepthLayer = {
        index: 0,
        speedMultiplier: 1.0,
        sizeMultiplier: 1.0,
        opacityMultiplier: 1.0,
        blur: 0,
        columnCount: 10,
      };
      
      expect(layer.index).toBe(0);
      expect(layer.speedMultiplier).toBe(1.0);
    });
  });

  describe('MatrixEngineState', () => {
    it('should have all required properties', () => {
      const state: MatrixEngineState = {
        state: 'idle',
        theme: {
          id: 'test',
          name: 'Test',
          primaryColor: '#00ff00',
          secondaryColor: '#008800',
          headColor: '#ffffff',
          trailColors: ['#00cc00'],
          backgroundColor: '#000000',
          glowColor: '#00ff00',
          glowIntensity: 0.5,
          fontWeight: 400,
          characterSet: 'mixed',
        },
        columns: [],
        dimensions: { width: 800, height: 600, pixelRatio: 1 },
        metrics: {
          fps: 60,
          frameTime: 16.67,
          activeColumns: 0,
          totalCharacters: 0,
          lastFrameTimestamp: 0,
          frameCount: 0,
        },
        isPaused: false,
        isVisible: true,
      };
      
      expect(state.state).toBe('idle');
      expect(state.dimensions.width).toBe(800);
    });
  });

  describe('PerformanceConfig', () => {
    it('should have all required properties', () => {
      const config: PerformanceConfig = {
        targetFPS: 60,
        maxColumns: 100,
        useWebGL: false,
        useOffscreenCanvas: false,
        adaptiveQuality: true,
        allowFrameSkip: true,
        maxFrameSkip: 3,
        throttleOnBlur: true,
        throttledFPS: 10,
      };
      
      expect(config.targetFPS).toBe(60);
      expect(config.adaptiveQuality).toBe(true);
    });
  });

  describe('ColumnConfig', () => {
    it('should have all required properties', () => {
      const config: ColumnConfig = {
        minSpeed: 0.5,
        maxSpeed: 2.0,
        minLength: 10,
        maxLength: 30,
        density: 0.8,
        spacing: 18,
        randomizeStart: true,
        staggerSpawn: true,
        staggerDelay: 50,
        minRespawnDelay: 0,
        maxRespawnDelay: 100,
      };
      
      expect(config.density).toBe(0.8);
      expect(config.minSpeed).toBeLessThan(config.maxSpeed);
    });
  });

  describe('EffectsConfig', () => {
    it('should have all required properties', () => {
      const config: EffectsConfig = {
        enableDepth: true,
        depthLayers: 3,
        trailFade: 0.92,
        backgroundFade: 0.05,
        enableBloom: false,
        bloomIntensity: 0.5,
        enableVignette: false,
        vignetteIntensity: 0.3,
        enableScanlines: false,
        scanlineIntensity: 0.1,
        scanlineSpacing: 4,
        speedMultiplier: 1.0,
        characterBrightness: 1.0,
      };
      
      expect(config.enableDepth).toBe(true);
      expect(config.depthLayers).toBe(3);
    });
  });

  describe('FontConfig', () => {
    it('should have all required properties', () => {
      const config: FontConfig = {
        family: 'monospace',
        baseSize: 16,
        minSize: 12,
        maxSize: 20,
        weight: 400,
        letterSpacing: 0,
        sizeVariation: false,
      };
      
      expect(config.family).toBe('monospace');
      expect(config.baseSize).toBe(16);
    });
  });

  describe('CharacterSetConfig', () => {
    it('should have all required properties', () => {
      const config: CharacterSetConfig = {
        type: 'mixed',
        includeNumbers: true,
        includeSymbols: true,
        changeFrequency: 0.3,
        minChangeInterval: 5,
        maxChangeInterval: 30,
      };
      
      expect(config.type).toBe('mixed');
      expect(config.changeFrequency).toBe(0.3);
    });

    it('should allow custom characters', () => {
      const config: CharacterSetConfig = {
        type: 'custom',
        customChars: 'ABC123',
        includeNumbers: false,
        includeSymbols: false,
        changeFrequency: 0.5,
        minChangeInterval: 10,
        maxChangeInterval: 20,
      };
      
      expect(config.customChars).toBe('ABC123');
    });
  });
});
