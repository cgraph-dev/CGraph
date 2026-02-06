/**
 * Seasonal Theme Provider Module Types
 *
 * Type definitions for the seasonal theme system.
 *
 * @module modules/gamification/components/events/seasonal-theme-provider
 */

/** Available seasonal theme identifiers */
export type SeasonalTheme =
  | 'default'
  | 'halloween'
  | 'winter'
  | 'valentines'
  | 'spring'
  | 'summer'
  | 'fall';

/** Complete configuration for a seasonal theme */
export interface SeasonalThemeConfig {
  /** Theme identifier */
  theme: SeasonalTheme;
  /** Human-readable theme name */
  name: string;
  /** Theme color palette */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  /** Optional particle effect configuration */
  particles?: {
    /** Particle visual type */
    type: 'snow' | 'leaves' | 'hearts' | 'sparkles' | 'petals' | 'fireflies';
    /** Particle color */
    color: string;
    /** Number of particles to render */
    count: number;
    /** Animation speed multiplier */
    speed: number;
  };
  /** Optional visual effect toggles */
  effects?: {
    enableParticles: boolean;
    enableGradient: boolean;
    enableGlow: boolean;
  };
}

/** Context value provided by SeasonalThemeProvider */
export interface SeasonalThemeContextValue {
  /** Currently active theme configuration */
  currentTheme: SeasonalThemeConfig;
  /** Manually set the active theme */
  setTheme: (theme: SeasonalTheme) => void;
  /** Reset to auto-detected seasonal theme */
  resetToSeasonal: () => void;
  /** Whether a seasonal (non-default) theme is active */
  isSeasonalActive: boolean;
}

/** Props for the Particle visual component */
export interface ParticleProps {
  /** Particle visual type */
  type: NonNullable<SeasonalThemeConfig['particles']>['type'];
  /** Particle color */
  color: string;
  /** Animation start delay in seconds */
  delay: number;
  /** Animation duration in seconds */
  duration: number;
}

/** Props for the SeasonalThemeProvider wrapper component */
export interface SeasonalThemeProviderProps {
  /** Application content to wrap */
  children: React.ReactNode;
  /** Auto-detect season from current date */
  enableAutoDetect?: boolean;
  /** Enable floating particle effects */
  enableParticles?: boolean;
  /** Enable background gradient effects */
  enableGradients?: boolean;
}
