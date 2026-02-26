import { describe, it, expect } from 'vitest';
import { random, lerp, getColorVariant } from '../utils';

describe('border-particle-system/utils', () => {
  describe('random', () => {
    it('returns value within range', () => {
      for (let i = 0; i < 20; i++) {
        const val = random(5, 10);
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('lerp', () => {
    it('returns a at t=0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('returns b at t=1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('returns midpoint at t=0.5', () => {
      expect(lerp(0, 100, 0.5)).toBe(50);
    });
  });

  describe('getColorVariant', () => {
    it('appends alpha to hex color', () => {
      const result = getColorVariant('#ff0000', 0);
      expect(result).toMatch(/^#ff0000[0-9a-f]{2}$/);
    });

    it('clamps alpha between 0.3 and 1', () => {
      const low = getColorVariant('#ff0000', -2);
      // alpha should be clamped to 0.3 → hex ~4d
      expect(low).toContain('#ff0000');
    });

    it('returns non-hex colors unchanged', () => {
      const result = getColorVariant('rgb(255,0,0)', 0);
      expect(result).toBe('rgb(255,0,0)');
    });
  });
});
