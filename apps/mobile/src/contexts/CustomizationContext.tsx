/**
 * CustomizationContext — BACKWARD-COMPATIBLE SHIM
 *
 * The CustomizationProvider has been removed from App.tsx.
 * useCustomization() now reads directly from the Zustand customizationStore.
 * This file preserves the same API surface so existing consumers work.
 *
 * @deprecated Import from '@/stores/customizationStore' directly instead.
 */

import React from 'react';
import useCustomizationStore, { useTheme } from '@/stores/customizationStore';
import type { ThemeConfig } from '@/lib/customization/CustomizationEngine';

// ============================================================================
// CONTEXT INTERFACE (kept for type compat)
// ============================================================================

interface CustomizationContextValue {
  theme: ThemeConfig;
  systemColorScheme: 'light' | 'dark' | null;
  colors: ThemeConfig['colors'];
  typography: ThemeConfig['typography'];
  spacing: ThemeConfig['spacing'];
  borderRadius: ThemeConfig['borderRadius'];
  effects: ThemeConfig['effects'];
  animations: ThemeConfig['animations'];
  layout: ThemeConfig['layout'];
  getColor: (path: string) => string;
  getSpacing: (size: keyof ThemeConfig['spacing']['scale']) => number;
  getBorderRadius: (size: keyof ThemeConfig['borderRadius']) => number;
  getTypographySize: (level: number) => number;
}

// ============================================================================
// HOOK — now provider-free, reads from Zustand directly
// ============================================================================

export function useCustomization(): CustomizationContextValue {
  const theme = useTheme();

  const getColor = (path: string): string => {
    const parts = path.split('.');
    let current: Record<string, unknown> = theme.colors as Record<string, unknown>;
    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part] as Record<string, unknown>;
      } else {
        return theme.colors.primary[500];
      }
    }
    return typeof current === 'string' ? current : theme.colors.primary[500];
  };

  const getSpacing = (size: keyof ThemeConfig['spacing']['scale']): number => {
    return theme.spacing.scale[size];
  };

  const getBorderRadius = (size: keyof ThemeConfig['borderRadius']): number => {
    return theme.borderRadius[size];
  };

  const getTypographySize = (level: number): number => {
    const { baseSize, scaleRatio } = theme.typography;
    return Math.round(baseSize * Math.pow(scaleRatio, level));
  };

  return {
    theme,
    systemColorScheme: null, // No longer tracked here; use Appearance API if needed
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
}

/**
 * CustomizationProvider — no-op wrapper for backward compatibility.
 */
export function CustomizationProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ============================================================================
// HOC (kept for backward compat)
// ============================================================================

export function withCustomization<P extends object>(
  Component: React.ComponentType<P & { customization: CustomizationContextValue }>
) {
  return function WithCustomizationComponent(props: P) {
    const customization = useCustomization();
    return <Component {...props} customization={customization} />;
  };
}

