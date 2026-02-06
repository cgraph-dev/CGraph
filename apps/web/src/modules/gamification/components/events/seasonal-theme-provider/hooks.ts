import { createContext, useContext } from 'react';
import type { SeasonalThemeContextValue } from './types';

export const SeasonalThemeContext = createContext<SeasonalThemeContextValue | null>(null);

export function useSeasonalTheme() {
  const context = useContext(SeasonalThemeContext);
  if (!context) {
    throw new Error('useSeasonalTheme must be used within SeasonalThemeProvider');
  }
  return context;
}
