/**
 * AI-Powered Theme Engine - Color Theory Utilities
 *
 * @version 1.0.0
 * @since v0.7.33
 */

/**
 * Color Theory class.
 */
export class ColorTheory {
  /**
   * Convert HEX to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1] ?? '0', 16),
          g: parseInt(result[2] ?? '0', 16),
          b: parseInt(result[3] ?? '0', 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Convert RGB to HEX
   */
  static rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Convert RGB to HSL
   */
  static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Convert HSL to RGB
   */
  static hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  /**
   * Calculate color contrast ratio
   */
  static getContrastRatio(color1: string, color2: string): number {
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
    };

    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Generate complementary color
   */
  static getComplementary(hex: string): string {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.h = (hsl.h + 180) % 360;
    const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  /**
   * Generate analogous colors
   */
  static getAnalogous(hex: string, offset: number = 30): [string, string] {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    const hsl1 = { ...hsl, h: (hsl.h + offset) % 360 };
    const hsl2 = { ...hsl, h: (hsl.h - offset + 360) % 360 };

    const rgb1 = this.hslToRgb(hsl1.h, hsl1.s, hsl1.l);
    const rgb2 = this.hslToRgb(hsl2.h, hsl2.s, hsl2.l);

    return [this.rgbToHex(rgb1.r, rgb1.g, rgb1.b), this.rgbToHex(rgb2.r, rgb2.g, rgb2.b)];
  }

  /**
   * Generate triadic colors
   */
  static getTriadic(hex: string): [string, string, string] {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    const hsl1 = { ...hsl, h: (hsl.h + 120) % 360 };
    const hsl2 = { ...hsl, h: (hsl.h + 240) % 360 };

    const rgb1 = this.hslToRgb(hsl1.h, hsl1.s, hsl1.l);
    const rgb2 = this.hslToRgb(hsl2.h, hsl2.s, hsl2.l);

    return [hex, this.rgbToHex(rgb1.r, rgb1.g, rgb1.b), this.rgbToHex(rgb2.r, rgb2.g, rgb2.b)];
  }
}
