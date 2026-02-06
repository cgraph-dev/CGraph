/**
 * ForumThemeRenderer constants
 * @module modules/forums/components/forum-theme-renderer
 */

export const RADIUS_MAP: Record<string, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  full: '9999px',
};

export const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.1)',
  medium: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
  dramatic: '0 10px 25px rgba(0,0,0,0.3), 0 6px 10px rgba(0,0,0,0.2)',
};

export const FONT_SIZE_MAP: Record<string, string> = {
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
};

export const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export const DEFAULT_COLORS = {
  primary: '#22c55e',
  secondary: '#16a34a',
  accent: '#4ade80',
};

export const DEFAULT_THEME_COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  background: '#ffffff',
  surface: '#f8fafc',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  accent: '#8b5cf6',
};
