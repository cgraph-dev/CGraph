/**
 * ProfileCard Component
 * Main profile card component with multiple layouts
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useActiveProfileTheme, useProfileCardConfig } from '@/stores/theme';
import { SIZE_CONFIG, getHoverVariants, RADIUS_MAP } from './constants';
import { MinimalLayout } from './minimal-layout';
import { CompactLayout } from './compact-layout';
import { DetailedLayout } from './detailed-layout';
import { GamingLayout } from './gaming-layout';
import { SocialLayout } from './social-layout';
import { CreatorLayout } from './creator-layout';
import type { ProfileCardProps } from './types';
import { springs } from '@/lib/animation-presets';

/**
 * ProfileCard Component
 *
 * Renders user profile cards with:
 * - 7 different layout styles
 * - Customizable hover effects
 * - Animated badges and titles
 * - Theme-aware styling
 */
export const ProfileCard = memo(function ProfileCard({
  user,
  theme: propTheme,
  cardConfig: propConfig,
  className,
  onClick,
  size = 'md',
  interactive = true,
}: ProfileCardProps) {
  const storeTheme = useActiveProfileTheme();
  const storeConfig = useProfileCardConfig();

  const theme = propTheme ?? storeTheme;
  const config = propConfig ?? storeConfig;
  const sizeConfig = SIZE_CONFIG[size];

  const cardStyle = useMemo((): React.CSSProperties => {
    if (!theme) return {};

    const { colors, glassmorphism, borderRadius } = theme;

     
    return {
      '--glow-color': colors.accent,
      '--accent-color': colors.accent,
      backgroundColor: glassmorphism ? `${colors.surface}dd` : colors.surface,
      backdropFilter: glassmorphism ? 'blur(12px)' : 'none',
      border: `1px solid ${colors.accent}22`,
      borderRadius: RADIUS_MAP[borderRadius],
      color: colors.text,
      fontFamily: theme.fontFamily,
    } as React.CSSProperties; // type assertion: CSS custom properties not in CSSProperties type
  }, [theme]);

  const hoverVariants = theme ? getHoverVariants(theme.hoverEffect) : undefined;

  if (!config) {
    return null;
  }

  return (
    <motion.div
      className={cn('relative cursor-pointer overflow-hidden', sizeConfig.padding, className)}
      style={cardStyle}
      variants={hoverVariants}
      initial="initial"
      whileHover={interactive ? 'hover' : undefined}
      whileTap={interactive ? 'tap' : undefined}
      onClick={onClick}
      transition={springs.bouncy}
    >
      {/* Layout-specific content */}
      {config.layout === 'minimal' && (
        <MinimalLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'compact' && (
        <CompactLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'detailed' && (
        <DetailedLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'gaming' && (
        <GamingLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'social' && (
        <SocialLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'creator' && (
        <CreatorLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}
      {config.layout === 'custom' && (
        <DetailedLayout user={user} config={config} sizeConfig={sizeConfig} theme={theme} />
      )}

      {/* Online status indicator */}
      {user.isOnline && (
        <div
          className="absolute right-2 top-2 h-3 w-3 rounded-full bg-green-500"
          style={{ boxShadow: '0 0 8px #22c55e' }}
        />
      )}
    </motion.div>
  );
});
