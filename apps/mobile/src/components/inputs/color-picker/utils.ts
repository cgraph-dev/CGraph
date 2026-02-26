/**
 * Color conversion utilities for the color picker.
 * @module components/inputs/color-picker/utils
 */
import chroma from 'chroma-js';
import type { HSL } from './types';

export function hexToHSL(hex: string): HSL {
  try {
    const [h, s, l] = chroma(hex).hsl();
    return {
      h: isNaN(h) ? 0 : h,
      s: isNaN(s) ? 0 : s * 100,
      l: l * 100,
    };
  } catch {
    return { h: 0, s: 100, l: 50 };
  }
}

export function hslToHex(hsl: HSL): string {
  try {
    return chroma.hsl(hsl.h, hsl.s / 100, hsl.l / 100).hex();
  } catch {
    return '#000000';
  }
}
