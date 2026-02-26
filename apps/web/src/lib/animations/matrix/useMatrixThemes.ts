/**
 * Matrix Theme Selection Hook
 *
 * @description Provides theme utilities for the Matrix animation system.
 *
 * @version 1.0.0
 * @since v0.6.3
 * @author CGraph Development Team
 */

import { useMemo, useCallback } from 'react';
import type { MatrixTheme, ThemePreset } from './types';
import { getTheme, THEME_REGISTRY } from './themes';

/**
 * Hook for theme selection
 *
 * @returns Theme utilities
 */
export function useMatrixThemes() {
  const themes = useMemo(() => {
    return Object.entries(THEME_REGISTRY).map(([key, theme]) => ({
       
      id: key as ThemePreset, // safe downcast – structural boundary
      name: theme.name,
      primaryColor: theme.primaryColor,
      theme,
    }));
  }, []);

  const getThemeById = useCallback((id: ThemePreset): MatrixTheme => {
    return getTheme(id);
  }, []);

  return {
    themes,
    getTheme: getThemeById,
    defaultTheme: THEME_REGISTRY['matrix-green'],
  };
}
