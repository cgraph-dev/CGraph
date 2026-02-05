/**
 * Holographic UI Type Definitions
 * @module components/enhanced/ui/holographic-ui/types
 */

import type { ReactNode } from 'react';
import type { MotionProps } from 'framer-motion';

// =============================================================================
// THEME TYPES
// =============================================================================

export interface HoloTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  scanline: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface HoloConfig {
  /** Visual intensity level */
  intensity: 'subtle' | 'medium' | 'intense';
  /** Color preset or custom */
  preset: 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight' | 'custom';
  /** Custom theme colors */
  customTheme?: Partial<HoloTheme>;
  /** Enable animated scanlines */
  enableScanlines: boolean;
  /** Enable random flicker effect */
  enableFlicker: boolean;
  /** Enable mouse-based parallax */
  enableParallax: boolean;
  /** Enable 3D transforms */
  enable3D: boolean;
  /** Enable glow effects */
  enableGlow: boolean;
  /** Enable particle effects */
  enableParticles: boolean;
  /** Reduce motion for accessibility */
  reduceMotion: boolean;
  /** Glitch effect probability (0-1) */
  glitchProbability: number;
}

export type HoloPreset = 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight';

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface HoloContainerProps extends Omit<MotionProps, 'children'> {
  children: ReactNode;
  preset?: HoloPreset;
  intensity?: HoloConfig['intensity'];
  enableScanlines?: boolean;
  enableFlicker?: boolean;
  enableParallax?: boolean;
  enable3D?: boolean;
  enableGlow?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
  onClick?: () => void;
}

export interface HoloTextProps {
  children: ReactNode;
  variant?: 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  preset?: HoloPreset;
  animate?: boolean;
  glowIntensity?: number;
  gradient?: boolean;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

export interface HoloButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  preset?: HoloPreset;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

export interface HoloCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  preset?: HoloPreset;
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface HoloAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
  preset?: HoloPreset;
  ring?: boolean;
  className?: string;
}

export interface HoloInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'search';
  preset?: HoloPreset;
  disabled?: boolean;
  error?: string;
  label?: string;
  icon?: ReactNode;
  className?: string;
}

export interface HoloProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  preset?: HoloPreset;
  animated?: boolean;
  variant?: 'linear' | 'circular';
  className?: string;
}

export interface HoloBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  preset?: HoloPreset;
  pulse?: boolean;
  className?: string;
}

export interface HoloTab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface HoloTabsProps {
  tabs: HoloTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  preset?: HoloPreset;
  fullWidth?: boolean;
  className?: string;
}

export interface HoloDividerProps {
  preset?: HoloPreset;
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  className?: string;
}

export interface HoloModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  preset?: HoloPreset;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  className?: string;
}

export interface HoloNotificationProps {
  message: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  preset?: HoloPreset;
  duration?: number;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export interface HoloTooltipProps {
  children: ReactNode;
  content: ReactNode;
  preset?: HoloPreset;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export interface HoloProviderProps {
  children: ReactNode;
  config?: Partial<HoloConfig>;
}
