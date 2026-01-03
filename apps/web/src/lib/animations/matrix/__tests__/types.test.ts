/**
 * Matrix Animation Types Tests
 * Tests type definitions and structure for the Matrix animation system
 */

import { describe, it, expect } from 'vitest';
import type {
  CharacterSetType,
  ThemePreset,
  AnimationState,
  BlendMode,
  ColorStop,
  GlowConfig,
  MatrixTheme,
  MatrixCharacter,
  MatrixColumn,
  DepthLayer,
  PerformanceConfig,
  CharacterSetConfig,
  ColumnConfig,
  EffectsConfig,
  FontConfig,
  MatrixConfig,
  MatrixEngineState,
  DeepPartial,
} from '../types';

describe('Matrix Types', () => {
  describe('DeepPartial Utility Type', () => {
    it('should allow nested partial properties', () => {
      const partialConfig: DeepPartial<MatrixConfig> = {
        performance: {
          targetFPS: 30,
        },
      };
      expect(partialConfig.performance?.targetFPS).toBe(30);
    });

    it('should allow empty objects', () => {
      const empty: DeepPartial<MatrixConfig> = {};
      expect(empty).toBeDefined();
    });
  });

  describe('CharacterSetType', () => {
    it('should have all valid character set types', () => {
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
    it('should have all valid theme presets', () => {
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
    it('should have all valid animation states', () => {
      const validStates: AnimationState[] = [
        'idle',
        'starting',
        'running',
        'paused',
        'transitioning',
        'stopping',
        'stopped',
      ];
      expect(validStates).toHaveLength(7);
    });
  });

  describe('BlendMode', () => {
    it('should have all valid blend modes', () => {
      const validModes: BlendMode[] = [
        'source-over',
        'multiply',
        'screen',
        'overlay',
        'hard-light',
        'soft-light',
        'color-dodge',
        'difference',
      ];
      expect(validModes).toHaveLength(8);
    });
  });

  describe('ColorStop', () => {
    it('should define position and color', () => {
      const colorStop: ColorStop = {
        position: 0.5,
        color: '#00ff00',
      };
      expect(colorStop.position).toBe(0.5);
      expect(colorStop.color).toBe('#00ff00');
    });

    it('should allow optional alpha', () => {
      const colorStop: ColorStop = {
        position: 0,
        color: '#ff0000',
        alpha: 0.8,
      };
      expect(colorStop.alpha).toBe(0.8);
    });
  });

  describe('GlowConfig', () => {
    it('should have all required properties', () => {
      const glow: GlowConfig = {
        enabled: true,
        radius: 5,
        intensity: 0.7,
        pulsate: false,
      };
      expect(glow.enabled).toBe(true);
      expect(glow.radius).toBe(5);
    });

    it('should allow optional color and pulseSpeed', () => {
      const glow: GlowConfig = {
        enabled: true,
        radius: 4,
        color: '#00ff00',
        intensity: 0.5,
        pulsate: true,
        pulseSpeed: 2000,
      };
      expect(glow.color).toBe('#00ff00');
      expect(glow.pulseSpeed).toBe(2000);
    });
  });

  describe('MatrixTheme', () => {
    it('should have all required properties', () => {
      const theme: MatrixTheme = {
        id: 'test-theme',
        name: 'Test Theme',
        preset: 'custom',
        primaryColor: '#00ff00',
        secondaryColor: '#008800',
        tertiaryColor: '#004400',
        backgroundColor: '#000000',
        glow: {
          enabled: true,
          radius: 4,
          intensity: 0.5,
          pulsate: false,
        },
        opacity: {
          head: 1,
          body: 0.7,
          tail: 0.3,
          background: 0.05,
        },
      };
      expect(theme.id).toBe('test-theme');
      expect(theme.glow.enabled).toBe(true);
      expect(theme.opacity.head).toBe(1);
    });

    it('should allow optional trailGradient and depthColors', () => {
      const theme: MatrixTheme = {
        id: 'full-theme',
        name: 'Full Theme',
        preset: 'matrix-green',
        primaryColor: '#00ff00',
        secondaryColor: '#008800',
        tertiaryColor: '#004400',
        backgroundColor: '#000000',
        trailGradient: [
          { position: 0, color: '#00ff00', alpha: 1 },
          { position: 1, color: '#004400', alpha: 0.1 },
        ],
        glow: {
          enabled: true,
          radius: 4,
          intensity: 0.5,
          pulsate: false,
        },
        depthColors: {
          near: '#00ff00',
          mid: '#008800',
          far: '#004400',
        },
        opacity: {
          head: 1,
          body: 0.7,
          tail: 0.3,
          background: 0.05,
        },
      };
      expect(theme.trailGradient).toHaveLength(2);
      expect(theme.depthColors?.near).toBe('#00ff00');
    });
  });

  describe('MatrixCharacter', () => {
    it('should have all required properties', () => {
      const character: MatrixCharacter = {
        value: 'A',
        opacity: 1.0,
        isHead: true,
        brightness: 1.0,
        age: 0,
        changeTimer: 10,
        scale: 1.0,
        morphPhase: 0,
        morphTarget: '',
        isEncrypting: false,
      };
      expect(character.value).toBe('A');
      expect(character.isHead).toBe(true);
      expect(character.scale).toBe(1.0);
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

  describe('DepthLayer', () => {
    it('should have all required properties', () => {
      const layer: DepthLayer = {
        index: 0,
        speedMultiplier: 1.0,
        opacityMultiplier: 1.0,
        sizeMultiplier: 1.0,
        blur: 0,
        columnCount: 10,
      };
      expect(layer.index).toBe(0);
      expect(layer.speedMultiplier).toBe(1.0);
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

  describe('CharacterSetConfig', () => {
    it('should have all required properties', () => {
      const config: CharacterSetConfig = {
        type: 'katakana',
        includeNumbers: true,
        includeSymbols: false,
        changeFrequency: 0.05,
        minChangeInterval: 3,
        maxChangeInterval: 15,
      };
      expect(config.type).toBe('katakana');
      expect(config.changeFrequency).toBe(0.05);
    });

    it('should allow optional customChars', () => {
      const config: CharacterSetConfig = {
        type: 'custom',
        customChars: 'ABCDEF',
        includeNumbers: false,
        includeSymbols: false,
        changeFrequency: 0.1,
        minChangeInterval: 5,
        maxChangeInterval: 20,
      };
      expect(config.customChars).toBe('ABCDEF');
    });
  });

  describe('ColumnConfig', () => {
    it('should have all required properties', () => {
      const config: ColumnConfig = {
        minSpeed: 2,
        maxSpeed: 8,
        minLength: 5,
        maxLength: 25,
        density: 0.7,
        spacing: 18,
        randomizeStart: true,
        staggerStart: true,
        staggerDelay: 50,
        respawnRate: 0.03,
        minRespawnDelay: 0,
        maxRespawnDelay: 120,
      };
      expect(config.density).toBe(0.7);
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
        enableBloom: true,
        bloomIntensity: 0.5,
        enableScanlines: false,
        scanlineOpacity: 0.03,
        enableCRTEffect: false,
        crtStrength: 0.1,
        enableVignette: true,
        vignetteIntensity: 0.3,
        blendMode: 'source-over',
        speedMultiplier: 1,
      };
      expect(config.enableDepth).toBe(true);
      expect(config.blendMode).toBe('source-over');
    });
  });

  describe('FontConfig', () => {
    it('should have all required properties', () => {
      const config: FontConfig = {
        family: 'JetBrains Mono, monospace',
        baseSize: 16,
        minSize: 10,
        maxSize: 24,
        weight: 'normal',
        letterSpacing: 0,
        sizeVariation: true,
      };
      expect(config.family).toContain('JetBrains');
      expect(config.baseSize).toBe(16);
    });
  });

  describe('MatrixEngineState', () => {
    it('should have all required properties', () => {
      const mockTheme: MatrixTheme = {
        id: 'test-theme',
        name: 'Test Theme',
        preset: 'custom',
        primaryColor: '#00ff00',
        secondaryColor: '#008800',
        tertiaryColor: '#004400',
        backgroundColor: '#000000',
        glow: { enabled: true, radius: 4, intensity: 0.8, color: '#00ff00', pulsate: false },
        opacity: { head: 1, body: 0.7, tail: 0.3, background: 0.05 },
      };
      
      const state: MatrixEngineState = {
        state: 'running',
        theme: mockTheme,
        columns: [],
        dimensions: { width: 800, height: 600, pixelRatio: 1 },
        metrics: {
          fps: 60,
          frameTime: 16.67,
          activeColumns: 10,
          totalCharacters: 150,
          lastFrameTimestamp: Date.now(),
          frameCount: 100,
        },
        isPaused: false,
        isVisible: true,
      };
      expect(state.state).toBe('running');
      expect(state.dimensions.width).toBe(800);
      expect(state.metrics.fps).toBe(60);
    });
  });
});
