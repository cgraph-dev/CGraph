import { describe, it, expect } from 'vitest';
import { ColorTheory } from '../color-theory';

describe('ColorTheory', () => {
  describe('hexToRgb', () => {
    it('converts standard hex to rgb', () => {
      expect(ColorTheory.hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorTheory.hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorTheory.hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('handles hex without hash prefix', () => {
      expect(ColorTheory.hexToRgb('ff8800')).toEqual({ r: 255, g: 136, b: 0 });
    });

    it('returns black for invalid hex', () => {
      expect(ColorTheory.hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('converts white', () => {
      expect(ColorTheory.hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('converts black', () => {
      expect(ColorTheory.hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('rgbToHex', () => {
    it('converts rgb to hex string', () => {
      expect(ColorTheory.rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(ColorTheory.rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(ColorTheory.rgbToHex(0, 0, 255)).toBe('#0000ff');
    });

    it('converts white', () => {
      expect(ColorTheory.rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    it('converts black', () => {
      expect(ColorTheory.rgbToHex(0, 0, 0)).toBe('#000000');
    });
  });

  describe('rgbToHsl', () => {
    it('converts pure red', () => {
      const hsl = ColorTheory.rgbToHsl(255, 0, 0);
      expect(hsl.h).toBeCloseTo(0, 0);
      expect(hsl.s).toBeCloseTo(100, 0);
      expect(hsl.l).toBeCloseTo(50, 0);
    });

    it('converts pure green', () => {
      const hsl = ColorTheory.rgbToHsl(0, 255, 0);
      expect(hsl.h).toBeCloseTo(120, 0);
      expect(hsl.s).toBeCloseTo(100, 0);
      expect(hsl.l).toBeCloseTo(50, 0);
    });

    it('converts pure blue', () => {
      const hsl = ColorTheory.rgbToHsl(0, 0, 255);
      expect(hsl.h).toBeCloseTo(240, 0);
      expect(hsl.s).toBeCloseTo(100, 0);
      expect(hsl.l).toBeCloseTo(50, 0);
    });

    it('converts grey (zero saturation)', () => {
      const hsl = ColorTheory.rgbToHsl(128, 128, 128);
      expect(hsl.s).toBeCloseTo(0, 0);
    });

    it('handles high-lightness scenarios', () => {
      const hsl = ColorTheory.rgbToHsl(200, 220, 240);
      expect(hsl.l).toBeGreaterThan(50);
    });
  });

  describe('hslToRgb', () => {
    it('converts red hsl to rgb', () => {
      const rgb = ColorTheory.hslToRgb(0, 100, 50);
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('converts grey (zero saturation)', () => {
      const rgb = ColorTheory.hslToRgb(0, 0, 50);
      expect(rgb.r).toBe(rgb.g);
      expect(rgb.g).toBe(rgb.b);
    });

    it('round-trips through rgb->hsl->rgb', () => {
      const original = { r: 100, g: 150, b: 200 };
      const hsl = ColorTheory.rgbToHsl(original.r, original.g, original.b);
      const rgb = ColorTheory.hslToRgb(hsl.h, hsl.s, hsl.l);
      expect(rgb.r).toBeCloseTo(original.r, 0);
      expect(rgb.g).toBeCloseTo(original.g, 0);
      expect(rgb.b).toBeCloseTo(original.b, 0);
    });
  });

  describe('getContrastRatio', () => {
    it('returns 21 for black vs white', () => {
      const ratio = ColorTheory.getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1 for same color', () => {
      const ratio = ColorTheory.getContrastRatio('#ff0000', '#ff0000');
      expect(ratio).toBeCloseTo(1, 0);
    });

    it('returns value >= 1', () => {
      const ratio = ColorTheory.getContrastRatio('#336699', '#993366');
      expect(ratio).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getComplementary', () => {
    it('returns complementary of red (cyan-ish)', () => {
      const comp = ColorTheory.getComplementary('#ff0000');
      // complementary of pure red is cyan (#00ffff)
      const rgb = ColorTheory.hexToRgb(comp);
      expect(rgb.r).toBeLessThan(10);
      expect(rgb.g).toBeGreaterThan(240);
      expect(rgb.b).toBeGreaterThan(240);
    });

    it('returns a valid hex string', () => {
      const comp = ColorTheory.getComplementary('#336699');
      expect(comp).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  describe('getAnalogous', () => {
    it('returns two colors', () => {
      const result = ColorTheory.getAnalogous('#ff0000');
      expect(result).toHaveLength(2);
    });

    it('returns valid hex strings', () => {
      const [c1, c2] = ColorTheory.getAnalogous('#336699');
      expect(c1).toMatch(/^#[0-9a-f]{6}$/);
      expect(c2).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('accepts custom offset', () => {
      const result = ColorTheory.getAnalogous('#ff0000', 60);
      expect(result).toHaveLength(2);
    });
  });

  describe('getTriadic', () => {
    it('returns three colors including original', () => {
      const result = ColorTheory.getTriadic('#ff0000');
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('#ff0000');
    });

    it('returns valid hex strings', () => {
      const [, c1, c2] = ColorTheory.getTriadic('#336699');
      expect(c1).toMatch(/^#[0-9a-f]{6}$/);
      expect(c2).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});
