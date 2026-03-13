/**
 * Holographic UI Context and Provider
 * @version 4.0.0
 */

import { ReactNode, useState, useCallback, useMemo, useEffect, createContext, use } from 'react';
import { HoloTheme, HoloConfig, HOLO_PRESETS, DEFAULT_CONFIG } from './types';

interface HoloContextValue {
  theme: HoloTheme;
  config: HoloConfig;
  updateConfig: (updates: Partial<HoloConfig>) => void;
}

const HoloContext = createContext<HoloContextValue | null>(null);

/**
 * unknown for the enhanced module.
 */
/**
 * Hook for managing holo.
 * @returns The result.
 */
export function useHolo(): HoloContextValue {
  const context = use(HoloContext);
  if (!context) {
    throw new Error('useHolo must be used within a HoloProvider');
  }
  return context;
}

interface HoloProviderProps {
  children: ReactNode;
  config?: Partial<HoloConfig>;
}

/**
 * unknown for the enhanced module.
 */
/**
 * Holo Provider — context provider wrapper.
 */
export function HoloProvider({ children, config: userConfig }: HoloProviderProps) {
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
    const preset = config.preset === 'custom' ? 'cyan' : config.preset;
    const baseTheme = HOLO_PRESETS[preset];
    return { ...baseTheme, ...config.customTheme };
  }, [config.preset, config.customTheme]);

  const updateConfig = useCallback((updates: Partial<HoloConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <HoloContext.Provider value={{ theme, config, updateConfig }}>{children}</HoloContext.Provider>
  );
}
