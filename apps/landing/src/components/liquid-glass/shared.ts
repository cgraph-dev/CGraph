/**
 * CGraph Landing — Liquid Glass Shared Utilities
 *
 * Self-contained utility module for the landing page liquid glass redesign.
 * Mirrors the design tokens from MASTER.md (cgraph-liquid-glass-v1).
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Spring presets (Framer Motion) ──────────────────────────────────────── */

export const springPreset = { type: 'spring' as const, stiffness: 260, damping: 20, mass: 1 };
export const springSnap = { type: 'spring' as const, stiffness: 400, damping: 25, mass: 0.8 };
export const springGentle = { type: 'spring' as const, stiffness: 180, damping: 24, mass: 1.2 };

/* ── Glass surface class strings ─────────────────────────────────────────── */

export const glassSurface = [
  'bg-white/[0.72]',
  'backdrop-blur-[20px]',
  'backdrop-saturate-[1.6]',
  'border',
  'border-slate-200/60',
].join(' ');

export const glassSurfaceElevated = [
  'bg-white/[0.82]',
  'backdrop-blur-[24px]',
  'backdrop-saturate-[1.8]',
  'border',
  'border-slate-200/60',
].join(' ');

/* ── Shadow tokens ───────────────────────────────────────────────────────── */

export const shadowMd = '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)';
export const shadowLg = '0 8px 30px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)';
export const shadowXl = '0 20px 40px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)';

/* ── Glow colors (pastel iridescent palette) ─────────────────────────────── */

export const glowColors = {
  blue: 'rgba(147, 197, 253, 0.5)',
  purple: 'rgba(196, 181, 253, 0.5)',
  pink: 'rgba(249, 168, 212, 0.5)',
  green: 'rgba(134, 239, 172, 0.5)',
} as const;

/* ── Reduced motion ──────────────────────────────────────────────────────── */

/** Check if user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Stagger animation variants ──────────────────────────────────────────── */

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springPreset,
  },
};
