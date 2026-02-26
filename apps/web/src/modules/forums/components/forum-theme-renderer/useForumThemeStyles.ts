/**
 * useForumThemeStyles hook
 * @module modules/forums/components/forum-theme-renderer
 */

import { useActiveForumTheme } from '@/stores/theme';
import { RADIUS_MAP, SHADOW_MAP, DEFAULT_THEME_COLORS } from './constants';

/**
 * unknown for the forums module.
 */
/**
 * Hook for managing forum theme styles.
 */
export function useForumThemeStyles() {
  const theme = useActiveForumTheme();

  if (!theme) {
    return {
      containerStyle: {},
      cardStyle: {},
      buttonStyle: {},
      inputStyle: {},
    };
  }

  const { borderRadius = 'md', glassmorphism = false, shadows = 'subtle' } = theme;
  const colors = theme.colors ?? DEFAULT_THEME_COLORS;

  return {
    containerStyle: {
      backgroundColor: colors.background,
      color: colors.textPrimary,
    },
    cardStyle: {
      backgroundColor: glassmorphism ? 'rgba(255,255,255,0.05)' : colors.surface,
      backdropFilter: glassmorphism ? 'blur(10px)' : 'none',
      border: `1px solid ${colors.border}`,
      borderRadius: RADIUS_MAP[borderRadius] ?? RADIUS_MAP.md,
      boxShadow: SHADOW_MAP[shadows] ?? SHADOW_MAP.subtle,
    },
    buttonStyle: {
      backgroundColor: colors.primary,
      color: '#ffffff',
      borderRadius: RADIUS_MAP[borderRadius] ?? RADIUS_MAP.md,
    },
    inputStyle: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      color: colors.textPrimary,
      borderRadius: RADIUS_MAP[borderRadius] ?? RADIUS_MAP.md,
    },
  };
}
