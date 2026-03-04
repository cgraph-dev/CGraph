/**
 * Glass surface style presets — reusable CSSProperties objects for the CGraph brand.
 * @module styles/surfaces
 */
import type { CSSProperties } from 'react';

export const glassSurface: Record<string, CSSProperties> = {
  card: {
    backdropFilter: 'blur(var(--glass-blur-lg))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-lg))',
    background: 'var(--color-surface-card)',
    border: '1px solid var(--glass-border-md)',
    boxShadow: 'var(--shadow-card)',
  },

  panel: {
    backdropFilter: 'blur(var(--glass-blur-md))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-md))',
    background: 'var(--color-surface-glass)',
    border: '1px solid var(--glass-border)',
  },

  navbar: {
    backdropFilter: 'blur(var(--glass-blur-xl))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-xl))',
    background: 'rgba(13, 17, 23, 0.75)',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 1px 0 var(--glass-border)',
  },

  modal: {
    backdropFilter: 'blur(var(--glass-blur-xl))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-xl))',
    background: 'rgba(15, 19, 40, 0.92)',
    border: '1px solid var(--glass-border-lg)',
    boxShadow: 'var(--shadow-card)',
  },

  tooltip: {
    backdropFilter: 'blur(var(--glass-blur-sm))',
    WebkitBackdropFilter: 'blur(var(--glass-blur-sm))',
    background: 'rgba(15, 19, 40, 0.95)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-card)',
  },
};

export const glassClasses = {
  card: 'backdrop-blur-xl bg-[rgba(15,19,40,0.85)] border border-white/[0.12] shadow-card',
  panel: 'backdrop-blur-md bg-white/[0.04] border border-white/[0.08]',
  navbar: 'backdrop-blur-[48px] bg-[rgba(13,17,23,0.75)] border border-white/[0.08]',
  modal: 'backdrop-blur-[48px] bg-[rgba(15,19,40,0.92)] border border-white/[0.18] shadow-card',
  tooltip: 'backdrop-blur-sm bg-[rgba(15,19,40,0.95)] border border-white/[0.08]',
} as const;
