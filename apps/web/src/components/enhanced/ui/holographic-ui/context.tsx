/**
 * Holographic UI Context and Provider
 * @module components/enhanced/ui/holographic-ui/context
 */

import { createContext, use, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { HoloTheme, HoloConfig, HoloProviderProps } from './types';
import { HOLO_PRESETS } from './presets';

// =============================================================================
// CONTEXT
// =============================================================================

interface HoloContextValue {
  theme: HoloTheme;
  config: HoloConfig;
  updateConfig: (updates: Partial<HoloConfig>) => void;
}

export const HoloContext = createContext<HoloContextValue | null>(null);

/**
 * Hook to access HoloContext
 * @throws Error if used outside HoloProvider
 */
export function useHolo(): HoloContextValue {
  const context = use(HoloContext);
  if (!context) {
    throw new Error('useHolo must be used within a HoloProvider');
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

/**
 * Default configuration for holographic UI
 */
const DEFAULT_CONFIG: HoloConfig = {
  intensity: 'medium',
  preset: 'cyan',
  enableScanlines: true,
  enableFlicker: true,
  enableParallax: true,
  enable3D: true,
  enableGlow: true,
  enableParticles: true,
  reduceMotion: false,
  glitchProbability: 0.02,
};

/**
 * Provider component for holographic UI context
 */
export function HoloProvider({ children, config: userConfig }: HoloProviderProps): ReactNode {
  const [config, setConfig] = useState<HoloConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig,
  }));

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setConfig((prev) => ({ ...prev, reduceMotion: true }));
    }

    const handler = (e: MediaQueryListEvent) => {
      setConfig((prev) => ({ ...prev, reduceMotion: e.matches }));
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const theme = useMemo(() => {
    const preset = config.preset === 'custom' ? 'cyan' : (config.preset ?? 'cyan');
    const baseTheme = HOLO_PRESETS[preset];
    return { ...baseTheme, ...config.customTheme };
  }, [config.preset, config.customTheme]);

  const updateConfig = useCallback((updates: Partial<HoloConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(() => ({ theme, config, updateConfig }), [theme, config, updateConfig]);

  return <HoloContext.Provider value={value}>{children}</HoloContext.Provider>;
}
