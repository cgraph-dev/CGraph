/**
 * ForumThemeProvider component
 * @module modules/forums/components/forum-theme-renderer
 */

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { sanitizeCss } from '@/lib/security';
import type { ForumThemeProviderProps } from './types';
import { RADIUS_MAP, SHADOW_MAP, FONT_SIZE_MAP } from './constants';

export const ForumThemeProvider = memo(function ForumThemeProvider({
  theme,
  children,
  className,
}: ForumThemeProviderProps) {
  const cssVariables = useMemo((): React.CSSProperties => {
    const { colors, borderRadius, borderWidth, shadows, fontFamily, headerFontFamily, fontSize } =
      theme;

    return {
      '--forum-primary': colors.primary,
      '--forum-secondary': colors.secondary,
      '--forum-accent': colors.accent,
      '--forum-background': colors.background,
      '--forum-surface': colors.surface,
      '--forum-elevated': colors.elevated,
      '--forum-text-primary': colors.textPrimary,
      '--forum-text-secondary': colors.textSecondary,
      '--forum-text-muted': colors.textMuted,
      '--forum-border': colors.border,
      '--forum-divider': colors.divider,
      '--forum-success': colors.success,
      '--forum-warning': colors.warning,
      '--forum-error': colors.error,
      '--forum-info': colors.info,
      '--forum-member-color': colors.memberColor,
      '--forum-mod-color': colors.modColor,
      '--forum-admin-color': colors.adminColor,
      '--forum-owner-color': colors.ownerColor,
      '--forum-radius': RADIUS_MAP[borderRadius],
      '--forum-border-width': `${borderWidth}px`,
      '--forum-shadow': SHADOW_MAP[shadows],
      '--forum-font-family': fontFamily,
      '--forum-header-font-family': headerFontFamily,
      '--forum-font-size': FONT_SIZE_MAP[fontSize],
      backgroundColor: colors.background,
      color: colors.textPrimary,
      fontFamily: fontFamily,
    } as React.CSSProperties; // safe downcast – CSS custom properties
  }, [theme]);

  return (
    <div className={cn('forum-theme-container min-h-screen', className)} style={cssVariables}>
      {/* Inject custom CSS - sanitized to prevent CSS injection attacks */}
      {theme.customCss && (
        <style dangerouslySetInnerHTML={{ __html: sanitizeCss(theme.customCss) }} />
      )}

      {/* Glassmorphism backdrop */}
      {theme.glassmorphism && (
        <style>{`
          .forum-theme-container .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>
      )}

      {children}
    </div>
  );
});

export default ForumThemeProvider;
