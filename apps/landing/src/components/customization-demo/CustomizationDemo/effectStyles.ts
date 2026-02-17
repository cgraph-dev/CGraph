/**
 * Effect Style Utilities
 *
 * Returns distinct CSS styles and framer-motion animation props for each
 * EffectPreset. Matches the web app's real visual treatments.
 *
 * @module components/landing/CustomizationDemo/effectStyles
 */

import type { TargetAndTransition, Transition } from 'framer-motion';
import type { EffectPreset } from './types';

interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
}

export interface EffectStyleResult {
  /** CSS properties for the preview container */
  container: Record<string, string>;
  /** framer-motion `animate` keyframes for the container (pulsing border glow, etc.) */
  containerAnimate: TargetAndTransition | Record<string, never>;
  /** framer-motion `transition` for the container animation */
  containerTransition: Transition;
  /** Whether to render an overlay effect child */
  hasOverlay: boolean;
  /** CSS for the overlay `<div>` (if hasOverlay) */
  overlayStyle: Record<string, string>;
  /** framer-motion `animate` for the overlay */
  overlayAnimate: TargetAndTransition;
  /** framer-motion `transition` for the overlay */
  overlayTransition: Transition;
}

/**
 * Get effect-specific styles and animations based on the active EffectPreset.
 * Mirrors the web app's profile-card-utils.ts logic.
 */
export function getEffectStyles(
  effect: EffectPreset,
  colors: ThemeColors,
  speedMultiplier: number = 1
): EffectStyleResult {
  switch (effect) {
    // ── Glassmorphism ──────────────────────────────────────────────────
    case 'glassmorphism':
      return {
        container: {
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },
        containerAnimate: {},
        containerTransition: {},
        hasOverlay: false,
        overlayStyle: {},
        overlayAnimate: {},
        overlayTransition: {},
      };

    // ── Neon ────────────────────────────────────────────────────────────
    case 'neon':
      return {
        container: {
          background: 'rgba(0, 0, 0, 0.92)',
          border: `1.5px solid ${colors.primary}`,
        },
        containerAnimate: {
          boxShadow: [
            `0 0 15px ${colors.primary}60, inset 0 0 15px ${colors.primary}10`,
            `0 0 35px ${colors.primary}90, inset 0 0 25px ${colors.primary}20`,
            `0 0 15px ${colors.primary}60, inset 0 0 15px ${colors.primary}10`,
          ],
        },
        containerTransition: {
          duration: 2 * speedMultiplier,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        hasOverlay: false,
        overlayStyle: {},
        overlayAnimate: {},
        overlayTransition: {},
      };

    // ── Holographic ────────────────────────────────────────────────────
    case 'holographic':
      return {
        container: {
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85), rgba(30, 41, 59, 0.85))',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        containerAnimate: {},
        containerTransition: {},
        hasOverlay: false,
        overlayStyle: {},
        overlayAnimate: {},
        overlayTransition: {},
      };

    // ── Minimal ─────────────────────────────────────────────────────────
    case 'minimal':
      return {
        container: {
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        containerAnimate: {},
        containerTransition: {},
        hasOverlay: false,
        overlayStyle: {},
        overlayAnimate: {},
        overlayTransition: {},
      };

    // ── Aurora ──────────────────────────────────────────────────────────
    case 'aurora':
      return {
        container: {
          background: `linear-gradient(135deg, ${colors.primary}18, ${colors.secondary}18)`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        containerAnimate: {},
        containerTransition: {},
        hasOverlay: false,
        overlayStyle: {},
        overlayAnimate: {},
        overlayTransition: {},
      };

    // ── Cyberpunk ───────────────────────────────────────────────────────
    case 'cyberpunk':
      return {
        container: {
          background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e)',
          border: `1px solid ${colors.primary}80`,
          clipPath:
            'polygon(0 8px, 8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
        },
        containerAnimate: {
          boxShadow: [
            `0 0 10px ${colors.primary}40`,
            `0 0 20px ${colors.primary}70, 0 0 4px ${colors.primary}`,
            `0 0 10px ${colors.primary}40`,
          ],
        },
        containerTransition: {
          duration: 1.5 * speedMultiplier,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        hasOverlay: true,
        overlayStyle: {
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(0, 255, 255, 0.03),
            rgba(0, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 3px
          )`,
          pointerEvents: 'none',
          position: 'absolute',
          inset: '0',
          borderRadius: 'inherit',
        },
        overlayAnimate: {
          opacity: [0.4, 0.7, 0.4],
        },
        overlayTransition: {
          duration: 3 * speedMultiplier,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

    default:
      return {
        container: {
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        containerAnimate: {},
        containerTransition: {},
        hasOverlay: false,
        overlayStyle: {},
        overlayAnimate: {},
        overlayTransition: {},
      };
  }
}
