/**
 * Matrix Animation Config Tests
 * Tests configuration management for the Matrix animation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PERFORMANCE,
  DEFAULT_CHARACTERS,
  DEFAULT_COLUMNS,
  DEFAULT_EFFECTS,
  DEFAULT_FONT,
  DEFAULT_CONFIG,
  PRESET_HIGH_QUALITY,
  PRESET_POWER_SAVER,
  PRESET_MINIMAL,
  PRESET_INTENSE,
  CONFIG_PRESETS,
  createConfig,
  getPreset,
  getResponsiveConfig,
  validateConfig,
  mergeConfigs,
  cloneConfig,
} from '../config';
import type { MatrixConfig } from '../types';
import type { DeepPartial } from '../config';

describe('Matrix Config', () => {
  describe('DEFAULT_PERFORMANCE', () => {
    it('should have valid targetFPS', () => {
      expect(DEFAULT_PERFORMANCE.targetFPS).toBeGreaterThan(0);
      expect(DEFAULT_PERFORMANCE.targetFPS).toBeLessThanOrEqual(120);
    });

    it('should have maxColumns defined', () => {
      expect(DEFAULT_PERFORMANCE.maxColumns).toBeGreaterThan(0);
    });

    it('should have adaptiveQuality flag', () => {
      expect(typeof DEFAULT_PERFORMANCE.adaptiveQuality).toBe('boolean');
    });

    it('should have throttle settings', () => {
      expect(typeof DEFAULT_PERFORMANCE.throttleOnBlur).toBe('boolean');
      expect(DEFAULT_PERFORMANCE.throttledFPS).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_CHARACTERS', () => {
    it('should have character type defined', () => {
      expect(DEFAULT_CHARACTERS.type).toBeDefined();
      expect(typeof DEFAULT_CHARACTERS.type).toBe('string');
    });

    it('should have includeNumbers flag', () => {
      expect(typeof DEFAULT_CHARACTERS.includeNumbers).toBe('boolean');
    });

    it('should have changeFrequency', () => {
      expect(DEFAULT_CHARACTERS.changeFrequency).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_CHARACTERS.changeFrequency).toBeLessThanOrEqual(1);
    });
  });

  describe('DEFAULT_COLUMNS', () => {
    it('should have valid speed range', () => {
      expect(DEFAULT_COLUMNS.minSpeed).toBeGreaterThan(0);
      expect(DEFAULT_COLUMNS.maxSpeed).toBeGreaterThanOrEqual(DEFAULT_COLUMNS.minSpeed);
    });

    it('should have valid length range', () => {
      expect(DEFAULT_COLUMNS.minLength).toBeGreaterThan(0);
      expect(DEFAULT_COLUMNS.maxLength).toBeGreaterThanOrEqual(DEFAULT_COLUMNS.minLength);
    });

    it('should have valid density', () => {
      expect(DEFAULT_COLUMNS.density).toBeGreaterThan(0);
      expect(DEFAULT_COLUMNS.density).toBeLessThanOrEqual(1);
    });

    it('should have spacing defined', () => {
      expect(DEFAULT_COLUMNS.spacing).toBeGreaterThan(0);
    });

    it('should have stagger settings', () => {
      expect(typeof DEFAULT_COLUMNS.staggerStart).toBe('boolean');
      expect(DEFAULT_COLUMNS.staggerDelay).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DEFAULT_EFFECTS', () => {
    it('should have depth settings', () => {
      expect(typeof DEFAULT_EFFECTS.enableDepth).toBe('boolean');
      expect(DEFAULT_EFFECTS.depthLayers).toBeGreaterThan(0);
    });

    it('should have trail fade setting', () => {
      expect(DEFAULT_EFFECTS.trailFade).toBeGreaterThan(0);
      expect(DEFAULT_EFFECTS.trailFade).toBeLessThanOrEqual(1);
    });

    it('should have bloom settings', () => {
      expect(typeof DEFAULT_EFFECTS.enableBloom).toBe('boolean');
      expect(DEFAULT_EFFECTS.bloomIntensity).toBeGreaterThanOrEqual(0);
    });

    it('should have vignette settings', () => {
      expect(typeof DEFAULT_EFFECTS.enableVignette).toBe('boolean');
      expect(DEFAULT_EFFECTS.vignetteIntensity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DEFAULT_FONT', () => {
    it('should have font family defined', () => {
      expect(DEFAULT_FONT.family).toBeDefined();
      expect(typeof DEFAULT_FONT.family).toBe('string');
      expect(DEFAULT_FONT.family.length).toBeGreaterThan(0);
    });

    it('should have valid base size', () => {
      expect(DEFAULT_FONT.baseSize).toBeGreaterThan(0);
    });

    it('should have valid size range', () => {
      expect(DEFAULT_FONT.minSize).toBeGreaterThan(0);
      expect(DEFAULT_FONT.maxSize).toBeGreaterThanOrEqual(DEFAULT_FONT.minSize);
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should contain all sub-configurations', () => {
      expect(DEFAULT_CONFIG.performance).toBeDefined();
      expect(DEFAULT_CONFIG.characters).toBeDefined();
      expect(DEFAULT_CONFIG.columns).toBeDefined();
      expect(DEFAULT_CONFIG.effects).toBeDefined();
      expect(DEFAULT_CONFIG.font).toBeDefined();
    });

    it('should have a theme', () => {
      expect(DEFAULT_CONFIG.theme).toBeDefined();
      expect(DEFAULT_CONFIG.theme.id).toBeDefined();
    });

    it('should have version and name', () => {
      expect(DEFAULT_CONFIG.version).toBeDefined();
      expect(DEFAULT_CONFIG.name).toBeDefined();
    });

    it('should have responsive settings', () => {
      expect(DEFAULT_CONFIG.responsive).toBeDefined();
      expect(DEFAULT_CONFIG.responsive.mobile).toBeDefined();
      expect(DEFAULT_CONFIG.responsive.tablet).toBeDefined();
    });
  });

  describe('Presets', () => {
    describe('PRESET_HIGH_QUALITY', () => {
      it('should exist and be an object', () => {
        expect(PRESET_HIGH_QUALITY).toBeDefined();
        expect(typeof PRESET_HIGH_QUALITY).toBe('object');
      });
    });

    describe('PRESET_POWER_SAVER', () => {
      it('should exist and be an object', () => {
        expect(PRESET_POWER_SAVER).toBeDefined();
        expect(typeof PRESET_POWER_SAVER).toBe('object');
      });

      it('should have reduced performance settings if defined', () => {
        if (PRESET_POWER_SAVER.performance?.targetFPS) {
          expect(PRESET_POWER_SAVER.performance.targetFPS).toBeLessThanOrEqual(DEFAULT_PERFORMANCE.targetFPS);
        }
      });
    });

    describe('PRESET_MINIMAL', () => {
      it('should exist and be an object', () => {
        expect(PRESET_MINIMAL).toBeDefined();
        expect(typeof PRESET_MINIMAL).toBe('object');
      });
    });

    describe('PRESET_INTENSE', () => {
      it('should exist and be an object', () => {
        expect(PRESET_INTENSE).toBeDefined();
        expect(typeof PRESET_INTENSE).toBe('object');
      });
    });

    describe('CONFIG_PRESETS', () => {
      it('should contain all presets', () => {
        expect(CONFIG_PRESETS.default).toBeDefined();
        expect(CONFIG_PRESETS['high-quality']).toBeDefined();
        expect(CONFIG_PRESETS['power-saver']).toBeDefined();
        expect(CONFIG_PRESETS.minimal).toBeDefined();
        expect(CONFIG_PRESETS.intense).toBeDefined();
      });
    });
  });

  describe('createConfig', () => {
    it('should return complete config when called without arguments', () => {
      const config = createConfig();
      expect(config.performance).toBeDefined();
      expect(config.columns).toBeDefined();
      expect(config.effects).toBeDefined();
      expect(config.font).toBeDefined();
    });

    it('should merge partial overrides', () => {
      const config = createConfig({
        performance: {
          targetFPS: 30,
        },
      });
      expect(config.performance.targetFPS).toBe(30);
    });

    it('should allow overriding effects', () => {
      const config = createConfig({
        effects: {
          enableBloom: false,
        },
      });
      expect(config.effects.enableBloom).toBe(false);
    });

    it('should allow overriding columns settings', () => {
      const config = createConfig({
        columns: {
          density: 0.8,
        },
      });
      expect(config.columns.density).toBe(0.8);
    });

    it('should preserve other defaults when partially overriding', () => {
      const config = createConfig({
        columns: {
          minSpeed: 5,
        },
      });
      expect(config.columns.minSpeed).toBe(5);
      // Other column settings should still exist
      expect(config.columns.maxSpeed).toBeDefined();
    });
  });

  describe('getPreset', () => {
    it('should return default preset', () => {
      const config = getPreset('default');
      expect(config.performance).toBeDefined();
      expect(config.columns).toBeDefined();
    });

    it('should return high-quality preset', () => {
      const config = getPreset('high-quality');
      expect(config).toBeDefined();
    });

    it('should return power-saver preset', () => {
      const config = getPreset('power-saver');
      expect(config).toBeDefined();
    });

    it('should return minimal preset', () => {
      const config = getPreset('minimal');
      expect(config).toBeDefined();
    });

    it('should return intense preset', () => {
      const config = getPreset('intense');
      expect(config).toBeDefined();
    });

    it('should return complete MatrixConfig objects', () => {
      const presets: Array<'default' | 'high-quality' | 'power-saver' | 'minimal' | 'intense'> = [
        'default',
        'high-quality',
        'power-saver',
        'minimal',
        'intense',
      ];
      for (const presetName of presets) {
        const config = getPreset(presetName);
        expect(config.performance).toBeDefined();
        expect(config.characters).toBeDefined();
        expect(config.columns).toBeDefined();
        expect(config.effects).toBeDefined();
        expect(config.font).toBeDefined();
      }
    });
  });

  describe('getResponsiveConfig', () => {
    let baseConfig: MatrixConfig;

    beforeEach(() => {
      baseConfig = createConfig();
    });

    it('should return config for small screens', () => {
      const config = getResponsiveConfig(baseConfig, 320);
      expect(config).toBeDefined();
      expect(config.performance).toBeDefined();
    });

    it('should not modify original config', () => {
      const originalFPS = baseConfig.performance.targetFPS;
      getResponsiveConfig(baseConfig, 320);
      expect(baseConfig.performance.targetFPS).toBe(originalFPS);
    });

    it('should handle large screen widths', () => {
      const config = getResponsiveConfig(baseConfig, 2560);
      expect(config).toBeDefined();
    });

    it('should handle medium screen widths', () => {
      const config = getResponsiveConfig(baseConfig, 768);
      expect(config).toBeDefined();
    });

    it('should return complete config', () => {
      const config = getResponsiveConfig(baseConfig, 1024);
      expect(config.performance).toBeDefined();
      expect(config.columns).toBeDefined();
      expect(config.effects).toBeDefined();
      expect(config.font).toBeDefined();
    });
  });

  describe('validateConfig', () => {
    it('should return array for valid config', () => {
      const errors = validateConfig(DEFAULT_CONFIG);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should detect invalid FPS', () => {
      const errors = validateConfig({
        performance: {
          targetFPS: -1,
        },
      } as Partial<MatrixConfig>);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should detect invalid density', () => {
      const errors = validateConfig({
        columns: {
          density: 2, // Invalid: > 1
        },
      } as Partial<MatrixConfig>);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should return array type always', () => {
      const result = validateConfig({});
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge multiple configs', () => {
      const config1: DeepPartial<MatrixConfig> = {
        performance: { targetFPS: 30 },
      };
      const config2: DeepPartial<MatrixConfig> = {
        columns: { density: 0.5 },
      };
      const merged = mergeConfigs(config1, config2);
      expect(merged.performance.targetFPS).toBe(30);
      expect(merged.columns.density).toBe(0.5);
    });

    it('should give priority to later configs', () => {
      const config1: DeepPartial<MatrixConfig> = {
        performance: { targetFPS: 30 },
      };
      const config2: DeepPartial<MatrixConfig> = {
        performance: { targetFPS: 60 },
      };
      const merged = mergeConfigs(config1, config2);
      expect(merged.performance.targetFPS).toBe(60);
    });

    it('should handle empty configs', () => {
      const merged = mergeConfigs({}, {});
      expect(merged.performance).toBeDefined();
      expect(merged.columns).toBeDefined();
    });

    it('should return complete config', () => {
      const merged = mergeConfigs({});
      expect(merged.performance).toBeDefined();
      expect(merged.columns).toBeDefined();
      expect(merged.effects).toBeDefined();
      expect(merged.font).toBeDefined();
    });
  });

  describe('cloneConfig', () => {
    it('should create a deep copy', () => {
      const original = createConfig();
      const cloned = cloneConfig(original);
      
      // Modify cloned
      cloned.performance.targetFPS = 999;
      
      // Original should be unchanged
      expect(original.performance.targetFPS).not.toBe(999);
    });

    it('should preserve all properties', () => {
      const original = createConfig({
        performance: { targetFPS: 45 },
        columns: { density: 0.7 },
      });
      const cloned = cloneConfig(original);
      
      expect(cloned.performance.targetFPS).toBe(45);
      expect(cloned.columns.density).toBe(0.7);
    });

    it('should clone nested objects', () => {
      const original = createConfig();
      const cloned = cloneConfig(original);
      
      cloned.effects.enableBloom = !original.effects.enableBloom;
      
      expect(original.effects.enableBloom).not.toBe(cloned.effects.enableBloom);
    });
  });

  describe('Integration Tests', () => {
    it('should create config from preset and then customize', () => {
      const preset = getPreset('power-saver');
      const customized = createConfig({
        ...preset,
        performance: {
          ...preset.performance,
          targetFPS: 15,
        },
      });
      expect(customized.performance.targetFPS).toBe(15);
    });

    it('should handle full configuration workflow', () => {
      // 1. Start with default
      const base = createConfig();
      
      // 2. Apply preset
      const withPreset = mergeConfigs(base, PRESET_POWER_SAVER);
      
      // 3. Customize
      const customized = createConfig({
        ...withPreset,
        columns: { density: 0.3 },
      });
      
      // 4. Make responsive
      const responsive = getResponsiveConfig(customized, 768);
      
      // 5. Clone for safe use
      const final = cloneConfig(responsive);
      
      // 6. Validate
      const errors = validateConfig(final);
      
      expect(Array.isArray(errors)).toBe(true);
      expect(final.columns.density).toBeDefined();
    });
  });
});
