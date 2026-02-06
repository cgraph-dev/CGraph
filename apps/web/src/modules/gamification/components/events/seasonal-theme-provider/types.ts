export type SeasonalTheme =
  | 'default'
  | 'halloween'
  | 'winter'
  | 'valentines'
  | 'spring'
  | 'summer'
  | 'fall';

export interface SeasonalThemeConfig {
  theme: SeasonalTheme;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  particles?: {
    type: 'snow' | 'leaves' | 'hearts' | 'sparkles' | 'petals' | 'fireflies';
    color: string;
    count: number;
    speed: number;
  };
  effects?: {
    enableParticles: boolean;
    enableGradient: boolean;
    enableGlow: boolean;
  };
}

export interface SeasonalThemeContextValue {
  currentTheme: SeasonalThemeConfig;
  setTheme: (theme: SeasonalTheme) => void;
  resetToSeasonal: () => void;
  isSeasonalActive: boolean;
}

export interface ParticleProps {
  type: NonNullable<SeasonalThemeConfig['particles']>['type'];
  color: string;
  delay: number;
  duration: number;
}

export interface SeasonalThemeProviderProps {
  children: React.ReactNode;
  enableAutoDetect?: boolean;
  enableParticles?: boolean;
  enableGradients?: boolean;
}
