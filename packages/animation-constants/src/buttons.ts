/**
 * Button animation presets for cinematic UI interactions.
 *
 * Used by:
 * - apps/web button components (magnetic pull, shimmer, flowing border)
 * - apps/mobile animated-button (gradient glow, haptic feedback patterns)
 *
 * Values are raw numbers — each platform adapts them to its animation framework
 * (Framer Motion on web, Reanimated on mobile).
 */

// ─── Magnetic ───────────────────────────────────────────────────

export interface MagneticPreset {
  readonly enabled: boolean;
  readonly pullStrength: number;
  readonly maxDisplacement: number;
  readonly springConfig: { readonly stiffness: number; readonly damping: number };
}

// ─── Shimmer ────────────────────────────────────────────────────

export interface ShimmerPreset {
  readonly enabled: boolean;
  readonly duration: number;
  readonly delay: number;
  readonly width: string;
}

// ─── Glow ───────────────────────────────────────────────────────

export interface GlowState {
  readonly blur: number;
  readonly spread: number;
  readonly opacity: number;
}

export interface GlowPreset {
  readonly idle: GlowState;
  readonly hover: GlowState;
  readonly colors: { readonly primary: string; readonly secondary: string };
}

// ─── Flowing Border ─────────────────────────────────────────────

export interface FlowingBorderPreset {
  readonly enabled: boolean;
  readonly duration: number;
  readonly width: number;
  readonly opacity: number;
}

// ─── Tap / Hover ────────────────────────────────────────────────

export interface TapPreset {
  readonly scale: number;
}

export interface HoverPreset {
  readonly scale: number;
  readonly y: number;
}

// ─── Reduced Motion ─────────────────────────────────────────────

export interface ButtonReducedMotion {
  readonly magnetic: Pick<MagneticPreset, 'enabled' | 'pullStrength' | 'maxDisplacement'>;
  readonly shimmer: Pick<ShimmerPreset, 'enabled'>;
  readonly glow: { readonly idle: GlowState; readonly hover: GlowState };
  readonly flowingBorder: Pick<FlowingBorderPreset, 'enabled'>;
}

// ─── Aggregate ──────────────────────────────────────────────────

export interface ButtonPresets {
  readonly magnetic: MagneticPreset;
  readonly shimmer: ShimmerPreset;
  readonly glow: GlowPreset;
  readonly flowingBorder: FlowingBorderPreset;
  readonly tap: TapPreset;
  readonly hover: HoverPreset;
  readonly reducedMotion: ButtonReducedMotion;
}

export const buttonPresets: ButtonPresets = {
  magnetic: {
    enabled: true,
    pullStrength: 0.3,
    maxDisplacement: 10,
    springConfig: { stiffness: 150, damping: 15 },
  },
  shimmer: {
    enabled: true,
    duration: 2000,
    delay: 4000,
    width: '200%',
  },
  glow: {
    idle: { blur: 20, spread: -4, opacity: 0.3 },
    hover: { blur: 30, spread: -4, opacity: 0.46 },
    colors: { primary: 'rgba(16,185,129,0.3)', secondary: 'rgba(139,92,246,0.25)' },
  },
  flowingBorder: {
    enabled: true,
    duration: 3000,
    width: 1,
    opacity: 0.45,
  },
  tap: { scale: 0.97 },
  hover: { scale: 1.02, y: -1 },
  reducedMotion: {
    magnetic: { enabled: false, pullStrength: 0, maxDisplacement: 0 },
    shimmer: { enabled: false },
    glow: {
      idle: { blur: 0, spread: 0, opacity: 0 },
      hover: { blur: 0, spread: 0, opacity: 0 },
    },
    flowingBorder: { enabled: false },
  },
} as const;
