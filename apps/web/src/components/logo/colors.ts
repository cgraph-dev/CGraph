/**
 * Logo Color Palettes
 *
 * Color configurations for each logo theme variant.
 * Each palette defines stroke, inner fill, glow, and node colors.
 *
 * @module components/logo/colors
 */

import type { LogoColorVariant } from './types';

/** Color palette for a single logo variant */
export interface LogoColorPalette {
  /** Primary stroke/outline color */
  stroke: string;
  /** Inner fill color */
  inner: string;
  /** Glow highlight color */
  glow: string;
  /** Connection node color */
  nodes: string;
}

/** Color palettes keyed by variant name */
export const colorPalettes: Record<LogoColorVariant, LogoColorPalette> = {
  default: {
    stroke: '#1a1a1a',
    inner: '#ffffff',
    glow: '#00d4ff',
    nodes: '#1a1a1a',
  },
  cyan: {
    stroke: '#0891b2',
    inner: '#ecfeff',
    glow: '#00d4ff',
    nodes: '#0891b2',
  },
  emerald: {
    stroke: '#047857',
    inner: '#ecfdf5',
    glow: '#10b981',
    nodes: '#047857',
  },
  purple: {
    stroke: '#7c3aed',
    inner: '#f5f3ff',
    glow: '#8b5cf6',
    nodes: '#7c3aed',
  },
  white: {
    stroke: '#ffffff',
    inner: 'transparent',
    glow: '#00d4ff',
    nodes: '#ffffff',
  },
  dark: {
    stroke: '#0f172a',
    inner: '#f8fafc',
    glow: '#00d4ff',
    nodes: '#0f172a',
  },
  gradient: {
    stroke: '#1a1a1a',
    inner: '#ffffff',
    glow: '#00d4ff',
    nodes: '#1a1a1a',
  },
};
