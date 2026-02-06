import type { SeasonalTheme, SeasonalThemeConfig } from './types';

export const SEASONAL_THEMES: Record<SeasonalTheme, SeasonalThemeConfig> = {
  default: {
    theme: 'default',
    name: 'Default',
    colors: {
      primary: '#8b5cf6',
      secondary: '#6366f1',
      accent: '#ec4899',
      background: '#0a0a0a',
    },
    effects: {
      enableParticles: false,
      enableGradient: false,
      enableGlow: false,
    },
  },
  halloween: {
    theme: 'halloween',
    name: 'Halloween',
    colors: {
      primary: '#ff6b2b',
      secondary: '#9333ea',
      accent: '#fbbf24',
      background: '#0a0508',
    },
    particles: {
      type: 'leaves',
      color: '#ff6b2b',
      count: 30,
      speed: 2,
    },
    effects: {
      enableParticles: true,
      enableGradient: true,
      enableGlow: true,
    },
  },
  winter: {
    theme: 'winter',
    name: 'Winter Holiday',
    colors: {
      primary: '#3b82f6',
      secondary: '#06b6d4',
      accent: '#e0f2fe',
      background: '#020617',
    },
    particles: {
      type: 'snow',
      color: '#e0f2fe',
      count: 50,
      speed: 1.5,
    },
    effects: {
      enableParticles: true,
      enableGradient: true,
      enableGlow: true,
    },
  },
  valentines: {
    theme: 'valentines',
    name: "Valentine's Day",
    colors: {
      primary: '#ec4899',
      secondary: '#f43f5e',
      accent: '#fda4af',
      background: '#0f0306',
    },
    particles: {
      type: 'hearts',
      color: '#ec4899',
      count: 25,
      speed: 1,
    },
    effects: {
      enableParticles: true,
      enableGradient: true,
      enableGlow: true,
    },
  },
  spring: {
    theme: 'spring',
    name: 'Spring',
    colors: {
      primary: '#10b981',
      secondary: '#84cc16',
      accent: '#fbbf24',
      background: '#020a03',
    },
    particles: {
      type: 'petals',
      color: '#fda4af',
      count: 30,
      speed: 1.2,
    },
    effects: {
      enableParticles: true,
      enableGradient: true,
      enableGlow: false,
    },
  },
  summer: {
    theme: 'summer',
    name: 'Summer',
    colors: {
      primary: '#f59e0b',
      secondary: '#facc15',
      accent: '#fde047',
      background: '#0a0602',
    },
    particles: {
      type: 'fireflies',
      color: '#fde047',
      count: 20,
      speed: 0.8,
    },
    effects: {
      enableParticles: true,
      enableGradient: false,
      enableGlow: true,
    },
  },
  fall: {
    theme: 'fall',
    name: 'Fall',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#fb923c',
      background: '#0a0402',
    },
    particles: {
      type: 'leaves',
      color: '#fb923c',
      count: 35,
      speed: 1.5,
    },
    effects: {
      enableParticles: true,
      enableGradient: true,
      enableGlow: false,
    },
  },
};
