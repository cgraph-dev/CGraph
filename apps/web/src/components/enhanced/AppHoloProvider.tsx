/**
 * Holographic UI Theme Integration
 * 
 * This module provides integration between the app's theme system
 * and the Holographic UI component library.
 */

import { ReactNode } from 'react';
import { HoloProvider, HoloConfig, HoloTheme } from '@/components/enhanced/ui';
import { useThemeEnhanced } from '@/contexts/ThemeContextEnhanced';

/**
 * Default HoloUI configuration for production use
 */
export const defaultHoloConfig: Partial<HoloConfig> = {
  intensity: 'medium',
  preset: 'cyan',
  enableScanlines: true,
  enableFlicker: false, // Disabled for accessibility
  enableParallax: true,
  enable3D: true,
  enableGlow: true,
  enableParticles: false, // Performance-friendly by default
  reduceMotion: false,
  glitchProbability: 0.02,
};

/**
 * Performance-optimized HoloUI config
 */
export const performanceHoloConfig: Partial<HoloConfig> = {
  intensity: 'subtle',
  preset: 'cyan',
  enableScanlines: false,
  enableFlicker: false,
  enableParallax: false,
  enable3D: false,
  enableGlow: true,
  enableParticles: false,
  reduceMotion: true,
  glitchProbability: 0,
};

/**
 * Accessibility-friendly HoloUI config
 */
export const accessibleHoloConfig: Partial<HoloConfig> = {
  intensity: 'subtle',
  preset: 'cyan',
  enableScanlines: false,
  enableFlicker: false,
  enableParallax: false,
  enable3D: false,
  enableGlow: false,
  enableParticles: false,
  reduceMotion: true,
  glitchProbability: 0,
};

/**
 * Premium/intense HoloUI config
 */
export const premiumHoloConfig: Partial<HoloConfig> = {
  intensity: 'intense',
  preset: 'gold',
  enableScanlines: true,
  enableFlicker: true,
  enableParallax: true,
  enable3D: true,
  enableGlow: true,
  enableParticles: true,
  reduceMotion: false,
  glitchProbability: 0.05,
};

interface AppHoloProviderProps {
  children: ReactNode;
  variant?: 'default' | 'performance' | 'accessible' | 'premium';
  config?: Partial<HoloConfig>;
}

/**
 * App-level Holographic UI Provider
 * 
 * Integrates with the app's theme context and provides
 * appropriate HoloUI configuration based on user preferences.
 */
export function AppHoloProvider({ 
  children, 
  variant = 'default',
  config: customConfig 
}: AppHoloProviderProps) {
  const { theme, reducedMotion, performanceMode } = useThemeEnhanced();
  
  // Select base config based on variant
  let baseConfig: Partial<HoloConfig>;
  switch (variant) {
    case 'performance':
      baseConfig = performanceHoloConfig;
      break;
    case 'accessible':
      baseConfig = accessibleHoloConfig;
      break;
    case 'premium':
      baseConfig = premiumHoloConfig;
      break;
    default:
      baseConfig = defaultHoloConfig;
  }
  
  // Apply overrides based on user preferences
  const finalConfig: Partial<HoloConfig> = {
    ...baseConfig,
    ...customConfig,
    // Always respect user's motion preference
    reduceMotion: reducedMotion || baseConfig.reduceMotion,
    // Reduce effects in performance mode
    ...(performanceMode && {
      enableParticles: false,
      enableFlicker: false,
      enable3D: false,
      intensity: 'subtle' as const,
    }),
  };
  
  // Map app theme colors to HoloUI theme
  const customTheme: Partial<HoloTheme> = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent || theme.colors.primary,
    glow: theme.colors.primary,
    background: theme.colors.background,
    surface: theme.colors.surface,
    text: theme.colors.text,
    textMuted: theme.colors.textMuted,
    border: theme.colors.border,
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    error: '#ef4444',   // red-500
    info: '#3b82f6',    // blue-500
  };
  
  const holoConfig: Partial<HoloConfig> = {
    ...finalConfig,
    customTheme,
    preset: 'custom',
  };
  
  return (
    <HoloProvider config={holoConfig}>
      {children}
    </HoloProvider>
  );
}

export default AppHoloProvider;
