import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SeasonalTheme, SeasonalThemeContextValue, SeasonalThemeProviderProps } from './types';
import { SEASONAL_THEMES } from './constants';
import { detectSeasonalTheme } from './utils';
import { SeasonalThemeContext } from './hooks';
import { Particle } from './Particle';

/**
 * SeasonalThemeProvider Component
 *
 * Automatically detects and applies seasonal themes based on the current date.
 * Provides a context for components to access the current seasonal theme.
 */
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
