/**
 * CustomizationContext - React Context for UI customization
 *
 * Provides theme configuration and customization methods to all components.
 * Integrates with Zustand store for state management.
 *
 * @version 1.0.0
 * @since v0.10.0
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import useCustomizationStore, { useTheme } from '@/stores/customizationStore';
import type { ThemeConfig } from '@/lib/customization/CustomizationEngine';

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

interface CustomizationContextValue {
  // Current theme
  theme: ThemeConfig;

  // System preferences
  systemColorScheme: 'light' | 'dark' | null;

  // Quick accessors
  colors: ThemeConfig['colors'];
  typography: ThemeConfig['typography'];
  spacing: ThemeConfig['spacing'];
  borderRadius: ThemeConfig['borderRadius'];
  effects: ThemeConfig['effects'];
  animations: ThemeConfig['animations'];
  layout: ThemeConfig['layout'];

  // Helper methods
  getColor: (path: string) => string;
  getSpacing: (size: keyof ThemeConfig['spacing']['scale']) => number;
  getBorderRadius: (size: keyof ThemeConfig['borderRadius']) => number;
  getTypographySize: (level: number) => number;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const CustomizationContext = createContext<CustomizationContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface CustomizationProviderProps {
  children: ReactNode;
}

export function CustomizationProvider({ children }: CustomizationProviderProps) {
  const theme = useTheme();
  const systemColorScheme = useColorScheme();
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        await useCustomizationStore.getState().loadTheme();
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadTheme();
  }, []);

  // Helper: Get color by path (e.g., "primary.500" or "text.primary")
  const getColor = (path: string): string => {
    const parts = path.split('.');
    let current: any = theme.colors;

    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        return theme.colors.primary[500]; // Default fallback
      }
    }

    return typeof current === 'string' ? current : theme.colors.primary[500];
  };

  // Helper: Get spacing value
  const getSpacing = (size: keyof ThemeConfig['spacing']['scale']): number => {
    return theme.spacing.scale[size];
  };

  // Helper: Get border radius value
  const getBorderRadius = (size: keyof ThemeConfig['borderRadius']): number => {
    return theme.borderRadius[size];
  };

  // Helper: Calculate typography size based on scale ratio
  const getTypographySize = (level: number): number => {
    const { baseSize, scaleRatio } = theme.typography;
    return Math.round(baseSize * Math.pow(scaleRatio, level));
  };

  const contextValue: CustomizationContextValue = {
    theme,
    systemColorScheme: systemColorScheme as 'light' | 'dark' | null,
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    effects: theme.effects,
    animations: theme.animations,
    layout: theme.layout,
    getColor,
    getSpacing,
    getBorderRadius,
    getTypographySize,
  };

  // Don't render children until theme is loaded
  if (!isInitialized) {
    return null; // Or a splash screen component
  }

  return (
    <CustomizationContext.Provider value={contextValue}>
      {children}
    </CustomizationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCustomization(): CustomizationContextValue {
  const context = useContext(CustomizationContext);

  if (context === undefined) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }

  return context;
}

// ============================================================================
// HOC (Higher-Order Component)
// ============================================================================

export function withCustomization<P extends object>(
  Component: React.ComponentType<P & { customization: CustomizationContextValue }>
) {
  return function WithCustomizationComponent(props: P) {
    const customization = useCustomization();
    return <Component {...props} customization={customization} />;
  };
}

export default CustomizationContext;
