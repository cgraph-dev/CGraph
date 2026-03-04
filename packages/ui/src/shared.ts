/**
 * CGraph Liquid Glass Design System — Shared Constants & Helpers
 *
 * Spring-physics presets, glass surface styles, and glow color maps
 * consumed by every Liquid Glass component.
 *
 * Self-contained — no external dependencies beyond peer deps.
 *
 * @module @cgraph/ui/shared
 */
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Transition } from 'framer-motion';

/* ── Utility ───────────────────────────────────────────────────────────────── */

/** Merge Tailwind classes with clsx + tailwind-merge. Self-contained cn(). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Spring-physics transition presets ──────────────────────────────────────── */

/** Default spring for hover / focus interactions. */
export const springPreset: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
  mass: 1,
};

/** Snappier spring for small elements (toggles, chips). */
export const springSnap: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

/** Gentle spring for modals & overlays. */
export const springGentle: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 24,
  mass: 1.2,
};

/* ── Glass surface class strings (Tailwind) ──────────────────────────────── */

/**
 * Base frosted-glass surface classes shared across Card, Modal, Dropdown, etc.
 * Pairs with `tokens.css` custom properties.
 */
export const glassSurface = [
  'bg-white/[0.72]',
  'backdrop-blur-[20px]',
  'backdrop-saturate-[1.6]',
  'border',
  'border-slate-200/60',
  'shadow-[0_4px_12px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]',
].join(' ');

/** Elevated variant for modals & floating panels. */
export const glassSurfaceElevated = [
  'bg-white/[0.82]',
  'backdrop-blur-[24px]',
  'backdrop-saturate-[1.8]',
  'border',
  'border-slate-200/60',
  'shadow-[0_20px_40px_rgba(0,0,0,0.10),0_8px_16px_rgba(0,0,0,0.06)]',
].join(' ');

/* ── Glow color map ────────────────────────────────────────────────────────── */

export const glowColors = {
  blue: {
    ring: 'ring-blue-300/50',
    shadow: '0 0 20px rgba(147,197,253,0.5), 0 0 40px rgba(147,197,253,0.25)',
    bg: 'bg-blue-500',
    hoverBg: 'hover:bg-blue-600',
    text: 'text-white',
    focusRing: 'focus-visible:ring-blue-400/60',
  },
  purple: {
    ring: 'ring-purple-300/50',
    shadow: '0 0 20px rgba(196,181,253,0.5), 0 0 40px rgba(196,181,253,0.25)',
    bg: 'bg-purple-500',
    hoverBg: 'hover:bg-purple-600',
    text: 'text-white',
    focusRing: 'focus-visible:ring-purple-400/60',
  },
  pink: {
    ring: 'ring-pink-300/50',
    shadow: '0 0 20px rgba(249,168,212,0.5), 0 0 40px rgba(249,168,212,0.25)',
    bg: 'bg-pink-500',
    hoverBg: 'hover:bg-pink-600',
    text: 'text-white',
    focusRing: 'focus-visible:ring-pink-400/60',
  },
  green: {
    ring: 'ring-green-300/50',
    shadow: '0 0 20px rgba(134,239,172,0.5), 0 0 40px rgba(134,239,172,0.25)',
    bg: 'bg-green-500',
    hoverBg: 'hover:bg-green-600',
    text: 'text-white',
    focusRing: 'focus-visible:ring-green-400/60',
  },
  red: {
    ring: 'ring-red-300/50',
    shadow: '0 0 20px rgba(252,165,165,0.5), 0 0 40px rgba(252,165,165,0.25)',
    bg: 'bg-red-500',
    hoverBg: 'hover:bg-red-600',
    text: 'text-white',
    focusRing: 'focus-visible:ring-red-400/60',
  },
  neutral: {
    ring: 'ring-slate-300/50',
    shadow: '0 0 20px rgba(148,163,184,0.4), 0 0 40px rgba(148,163,184,0.2)',
    bg: 'bg-slate-500',
    hoverBg: 'hover:bg-slate-600',
    text: 'text-white',
    focusRing: 'focus-visible:ring-slate-400/60',
  },
} as const;

export type GlowColor = keyof typeof glowColors;

/* ── Reduced-motion helper ─────────────────────────────────────────────────── */

/** Returns true when user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
