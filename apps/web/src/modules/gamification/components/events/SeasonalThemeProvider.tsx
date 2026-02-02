import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SeasonalThemeProvider Component
 *
 * Automatically detects and applies seasonal themes based on the current date.
 * Provides a context for components to access the current seasonal theme.
 *
 * Seasons:
 * - Halloween: October 1-31
 * - Winter/Holiday: December 1 - January 7
 * - Valentine's: February 1-14
 * - Spring: March 20 - May 31
 * - Summer: June 1 - August 31
 * - Fall: September 1 - November 30 (excluding Halloween)
 */

// ==================== TYPE DEFINITIONS ====================

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

// ==================== THEME DEFINITIONS ====================

const SEASONAL_THEMES: Record<SeasonalTheme, SeasonalThemeConfig> = {
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

// ==================== DATE DETECTION ====================

function detectSeasonalTheme(): SeasonalTheme {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Halloween (October 1-31)
  if (month === 10) {
    return 'halloween';
  }

  // Winter/Holiday (December 1 - January 7)
  if (month === 12 || (month === 1 && day <= 7)) {
    return 'winter';
  }

  // Valentine's (February 1-14)
  if (month === 2 && day <= 14) {
    return 'valentines';
  }

  // Spring (March 20 - May 31)
  if (month === 3 || month === 4 || month === 5) {
    return 'spring';
  }

  // Summer (June 1 - August 31)
  if (month === 6 || month === 7 || month === 8) {
    return 'summer';
  }

  // Fall (September 1 - November 30, excluding Halloween)
  if (month === 9 || month === 11) {
    return 'fall';
  }

  return 'default';
}

// ==================== CONTEXT ====================

interface SeasonalThemeContextValue {
  currentTheme: SeasonalThemeConfig;
  setTheme: (theme: SeasonalTheme) => void;
  resetToSeasonal: () => void;
  isSeasonalActive: boolean;
}

const SeasonalThemeContext = createContext<SeasonalThemeContextValue | null>(null);

export function useSeasonalTheme() {
  const context = useContext(SeasonalThemeContext);
  if (!context) {
    throw new Error('useSeasonalTheme must be used within SeasonalThemeProvider');
  }
  return context;
}

// ==================== PARTICLE COMPONENT ====================

interface ParticleProps {
  type: NonNullable<SeasonalThemeConfig['particles']>['type'];
  color: string;
  delay: number;
  duration: number;
}

function Particle({ type, color, delay, duration }: ParticleProps) {
  const getParticleShape = () => {
    switch (type) {
      case 'snow':
        return '❄️';
      case 'hearts':
        return '❤️';
      case 'leaves':
        return '🍂';
      case 'petals':
        return '🌸';
      case 'sparkles':
        return '✨';
      case 'fireflies':
        return '✨';
      default:
        return '•';
    }
  };

  const randomX = Math.random() * 100;
  const randomSway = (Math.random() - 0.5) * 30;

  return (
    <motion.div
      initial={{ top: '-5%', left: `${randomX}%`, opacity: 0 }}
      animate={{
        top: '105%',
        left: `${randomX + randomSway}%`,
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="pointer-events-none absolute"
      style={{ color, fontSize: type === 'hearts' ? '16px' : '12px' }}
    >
      {getParticleShape()}
    </motion.div>
  );
}

// ==================== PROVIDER COMPONENT ====================

interface SeasonalThemeProviderProps {
  children: ReactNode;
  enableAutoDetect?: boolean;
  enableParticles?: boolean;
  enableGradients?: boolean;
}

export default function SeasonalThemeProvider({
  children,
  enableAutoDetect = true,
  enableParticles = true,
  enableGradients = true,
}: SeasonalThemeProviderProps) {
  const [currentThemeName, setCurrentThemeName] = useState<SeasonalTheme>('default');
  const [isSeasonalActive, setIsSeasonalActive] = useState(false);

  useEffect(() => {
    if (enableAutoDetect) {
      const detectedTheme = detectSeasonalTheme();
      if (detectedTheme !== 'default') {
        setCurrentThemeName(detectedTheme);
        setIsSeasonalActive(true);
      }
    }
  }, [enableAutoDetect]);

  const currentTheme = SEASONAL_THEMES[currentThemeName];

  const setTheme = (theme: SeasonalTheme) => {
    setCurrentThemeName(theme);
    setIsSeasonalActive(theme !== 'default');
  };

  const resetToSeasonal = () => {
    const detectedTheme = detectSeasonalTheme();
    setCurrentThemeName(detectedTheme);
    setIsSeasonalActive(detectedTheme !== 'default');
  };

  const contextValue: SeasonalThemeContextValue = {
    currentTheme,
    setTheme,
    resetToSeasonal,
    isSeasonalActive,
  };

  const shouldShowParticles =
    enableParticles && currentTheme.particles && currentTheme.effects?.enableParticles;

  const shouldShowGradient =
    enableGradients && currentTheme.effects?.enableGradient && isSeasonalActive;

  return (
    <SeasonalThemeContext.Provider value={contextValue}>
      <div className="relative min-h-screen">
        {/* Seasonal gradient overlay */}
        <AnimatePresence>
          {shouldShowGradient && (
            <motion.div
              key="gradient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="pointer-events-none fixed inset-0 z-0"
              style={{
                background: `radial-gradient(ellipse at top, ${currentTheme.colors.primary}44 0%, transparent 50%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Particle system */}
        <AnimatePresence>
          {shouldShowParticles && currentTheme.particles && (
            <div key="particles" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
              {Array.from({ length: currentTheme.particles.count }).map((_, i) => (
                <Particle
                  key={i}
                  type={currentTheme.particles!.type}
                  color={currentTheme.particles!.color}
                  delay={i * 0.3}
                  duration={10 + Math.random() * 5}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </SeasonalThemeContext.Provider>
  );
}

// ==================== UTILITY EXPORTS ====================

export { SEASONAL_THEMES, detectSeasonalTheme };
