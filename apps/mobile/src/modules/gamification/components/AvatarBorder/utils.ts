/**
 * AvatarBorder — utility functions for border rendering.
 *
 * Pure math helpers for color conversion and registry lookups.
 * No framework imports — safe for any platform.
 *
 * @module gamification/components/AvatarBorder/utils
 */

import {
  BORDER_THEME_PALETTES,
  BORDER_REGISTRY,
  type BorderTheme,
  type BorderRegistryEntry,
} from '@cgraph/animation-constants';

/** Returns the full palette array for a theme */
export function getPalette(theme: BorderTheme): readonly string[] {
  return BORDER_THEME_PALETTES[theme];
}

/** Returns the primary (first) color for a theme */
export function getMainColor(theme: BorderTheme): string {
  return BORDER_THEME_PALETTES[theme][0];
}

/**
 * Convert a hex color to a desaturated, lighter glow variant.
 *
 * Reduces saturation by 30% and increases lightness by 20%.
 * Pure math — no color library dependency.
 */
export function getDesaturatedGlowColor(hex: string): string {
  // Parse hex → RGB
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;

  // RGB → HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

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

  // Adjust: reduce saturation by 30%, increase lightness by 20%
  const newS = Math.max(0, s - 0.3);
  const newL = Math.min(1, l + 0.2);

  // HSL → RGB
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let rr: number, gg: number, bb: number;

  if (newS === 0) {
    rr = gg = bb = newL;
  } else {
    const q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
    const p = 2 * newL - q;
    rr = hue2rgb(p, q, h + 1 / 3);
    gg = hue2rgb(p, q, h);
    bb = hue2rgb(p, q, h - 1 / 3);
  }

  // RGB → hex
  const toHex = (v: number): string => {
    const x = Math.round(v * 255);
    return x.toString(16).padStart(2, '0');
  };

  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}

/** Find a border registry entry by ID, or null */
export function getBorderRegistryEntry(borderId: string): BorderRegistryEntry | null {
  return BORDER_REGISTRY.find((b) => b.id === borderId) ?? null;
}
