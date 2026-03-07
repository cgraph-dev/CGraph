/**
 * Background effect presets for cinematic UI backgrounds.
 *
 * Used by:
 * - apps/web CinematicBackground (canvas particle engine)
 * - apps/mobile AnimatedBackground (gradient orbs)
 *
 * Each preset category has full / medium / subtle variants,
 * plus a reduced-motion fallback that disables animation entirely.
 */

// ─── Particle Field ─────────────────────────────────────────────

export interface ParticleFieldPreset {
  readonly count: number;
  readonly connectionDistance: number;
  readonly speed: number;
  readonly mouseRepulsion: number;
}

// ─── Cyber Grid ─────────────────────────────────────────────────

export interface CyberGridPreset {
  readonly cellSize: number;
  readonly glowIntensity: number;
  readonly pulseSpeed: number;
}

// ─── Aurora Glow ────────────────────────────────────────────────

export interface AuroraGlowPreset {
  readonly layers: number;
  readonly rotationDuration: number;
  readonly scale: readonly [number, number];
}

// ─── Colors ─────────────────────────────────────────────────────

export interface BackgroundColors {
  readonly emerald: string;
  readonly purple: string;
  readonly cyan: string;
  readonly teal: string;
  readonly particles: readonly string[];
}

// ─── Aggregate ──────────────────────────────────────────────────

export interface BackgroundPresets {
  readonly particleField: {
    readonly full: ParticleFieldPreset;
    readonly medium: ParticleFieldPreset;
    readonly subtle: ParticleFieldPreset;
  };
  readonly cyberGrid: {
    readonly full: CyberGridPreset;
    readonly subtle: CyberGridPreset;
  };
  readonly auroraGlow: {
    readonly full: AuroraGlowPreset;
    readonly subtle: AuroraGlowPreset;
  };
  readonly colors: BackgroundColors;
  readonly reducedMotion: {
    readonly particleField: ParticleFieldPreset;
    readonly cyberGrid: CyberGridPreset;
    readonly auroraGlow: AuroraGlowPreset;
  };
}

export const backgroundPresets: BackgroundPresets = {
  particleField: {
    full: { count: 100, connectionDistance: 150, speed: 0.5, mouseRepulsion: 80 },
    medium: { count: 60, connectionDistance: 120, speed: 0.4, mouseRepulsion: 60 },
    subtle: { count: 30, connectionDistance: 100, speed: 0.3, mouseRepulsion: 40 },
  },
  cyberGrid: {
    full: { cellSize: 40, glowIntensity: 0.8, pulseSpeed: 2000 },
    subtle: { cellSize: 60, glowIntensity: 0.4, pulseSpeed: 3000 },
  },
  auroraGlow: {
    full: { layers: 3, rotationDuration: 20000, scale: [1, 1.2] },
    subtle: { layers: 2, rotationDuration: 30000, scale: [1, 1.1] },
  },
  colors: {
    emerald: '#10b981',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    teal: '#14b8a6',
    particles: ['#8b5cf6', '#a78bfa', '#10b981', '#34d399', '#06b6d4'],
  },
  reducedMotion: {
    particleField: { count: 0, connectionDistance: 0, speed: 0, mouseRepulsion: 0 },
    cyberGrid: { cellSize: 40, glowIntensity: 0, pulseSpeed: 0 },
    auroraGlow: { layers: 0, rotationDuration: 0, scale: [1, 1] },
  },
} as const;
