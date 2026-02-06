/**
 * ForumThemeRenderer type definitions
 * @module modules/forums/components/forum-theme-renderer
 */

import type { ForumTheme, ForumTitleAnimation, ForumRoleStyle } from '@/stores/theme';

export interface AnimatedForumTitleProps {
  title: string;
  animation?: ForumTitleAnimation;
  speed?: number;
  colors?: { primary: string; secondary: string; accent: string };
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span';
}

export interface RoleBadgeProps {
  role: ForumRoleStyle;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ForumBannerProps {
  theme: ForumTheme;
  title?: string;
  subtitle?: string;
  className?: string;
}

export interface BannerParticlesProps {
  effect: 'snow' | 'stars' | 'embers' | 'matrix' | 'bubbles';
}

export interface ForumThemeProviderProps {
  theme: ForumTheme;
  children: React.ReactNode;
  className?: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}
