import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

/**
 * Forum Theme Store
 *
 * Manages forum theming and customization including:
 * - 10 built-in theme presets (MyBB-inspired)
 * - Custom CSS overrides
 * - Animated forum titles and headers
 * - Role badge visualization
 * - Banner/header customization
 */

// ==================== TYPE DEFINITIONS ====================

export type ForumThemePreset =
  | 'classic-mybb'
  | 'dark-elite'
  | 'cyberpunk'
  | 'fantasy-guild'
  | 'minimal-pro'
  | 'retro-gaming'
  | 'matrix-code'
  | 'sunset-gradient'
  | 'arctic-frost'
  | 'volcanic'
  | 'custom';

export type ForumTitleAnimation =
  | 'none'
  | 'gradient'
  | 'glow'
  | 'particle-trail'
  | 'letter-reveal'
  | 'holographic'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'neon-flicker'
  | 'matrix';

export type RoleBadgeStyle = 'none' | 'pill' | 'shield' | 'crown' | 'star' | 'diamond' | 'custom';

export interface ForumThemeColors {
  // Primary colors
  primary: string;
  secondary: string;
  accent: string;
  // Background colors
  background: string;
  surface: string;
  elevated: string;
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // UI elements
  border: string;
  divider: string;
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  // Role colors
  memberColor: string;
  modColor: string;
  adminColor: string;
  ownerColor: string;
}

export interface ForumBannerConfig {
  type: 'image' | 'video' | 'gradient' | 'animated';
  url?: string;
  gradient?: string;
  parallax: boolean;
  overlay: boolean;
  overlayOpacity: number;
  height: number; // in pixels
  particleEffect?: 'none' | 'snow' | 'stars' | 'embers' | 'matrix' | 'bubbles';
}

export interface ForumRoleStyle {
  id: string;
  name: string;
  color: string;
  badgeStyle: RoleBadgeStyle;
  badgeIcon?: string;
  glowEffect: boolean;
  animation?: 'none' | 'pulse' | 'shimmer' | 'rainbow';
}

export interface ForumTheme {
  id: string;
  name: string;
  preset: ForumThemePreset;
  colors: ForumThemeColors;
  // Typography
  fontFamily: string;
  headerFontFamily: string;
  fontSize: 'sm' | 'md' | 'lg';
  // Borders & Corners
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth: number;
  // Effects
  glassmorphism: boolean;
  shadows: 'none' | 'subtle' | 'medium' | 'dramatic';
  // Title animation
  titleAnimation: ForumTitleAnimation;
  titleAnimationSpeed: number;
  // Banner
  banner: ForumBannerConfig;
  // Role styles
  roleStyles: ForumRoleStyle[];
  // Custom CSS
  customCss: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
}

// ==================== PRESET THEMES ====================

export const FORUM_THEME_PRESETS: Record<
  ForumThemePreset,
  Omit<ForumTheme, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
> = {
  'classic-mybb': {
    name: 'Classic MyBB',
    preset: 'classic-mybb',
    colors: {
      primary: '#0F4C81',
      secondary: '#1565C0',
      accent: '#42A5F5',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      elevated: '#FFFFFF',
      textPrimary: '#212121',
      textSecondary: '#757575',
      textMuted: '#9E9E9E',
      border: '#E0E0E0',
      divider: '#EEEEEE',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
      memberColor: '#616161',
      modColor: '#388E3C',
      adminColor: '#D32F2F',
      ownerColor: '#7B1FA2',
    },
    fontFamily: 'Verdana, sans-serif',
    headerFontFamily: 'Tahoma, sans-serif',
    fontSize: 'md',
    borderRadius: 'sm',
    borderWidth: 1,
    glassmorphism: false,
    shadows: 'subtle',
    titleAnimation: 'none',
    titleAnimationSpeed: 1,
    banner: {
      type: 'gradient',
      gradient: 'linear-gradient(135deg, #0F4C81, #1565C0)',
      parallax: false,
      overlay: false,
      overlayOpacity: 0.5,
      height: 120,
    },
    roleStyles: [
      { id: 'member', name: 'Member', color: '#616161', badgeStyle: 'none', glowEffect: false },
      {
        id: 'mod',
        name: 'Moderator',
        color: '#388E3C',
        badgeStyle: 'shield',
        glowEffect: false,
        animation: 'none',
      },
      {
        id: 'admin',
        name: 'Admin',
        color: '#D32F2F',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'owner',
        name: 'Owner',
        color: '#7B1FA2',
        badgeStyle: 'diamond',
        glowEffect: true,
        animation: 'shimmer',
      },
    ],
    customCss: '',
    isPublic: true,
  },

  'dark-elite': {
    name: 'Dark Elite',
    preset: 'dark-elite',
    colors: {
      primary: '#BB86FC',
      secondary: '#03DAC6',
      accent: '#CF6679',
      background: '#121212',
      surface: '#1E1E1E',
      elevated: '#2D2D2D',
      textPrimary: '#FFFFFF',
      textSecondary: '#B3B3B3',
      textMuted: '#666666',
      border: '#333333',
      divider: '#2D2D2D',
      success: '#00E676',
      warning: '#FFAB00',
      error: '#CF6679',
      info: '#40C4FF',
      memberColor: '#B3B3B3',
      modColor: '#03DAC6',
      adminColor: '#CF6679',
      ownerColor: '#BB86FC',
    },
    fontFamily: 'Inter, sans-serif',
    headerFontFamily: 'Inter, sans-serif',
    fontSize: 'md',
    borderRadius: 'md',
    borderWidth: 1,
    glassmorphism: true,
    shadows: 'medium',
    titleAnimation: 'glow',
    titleAnimationSpeed: 2,
    banner: {
      type: 'gradient',
      gradient: 'linear-gradient(135deg, #1E1E1E, #2D2D2D, #1E1E1E)',
      parallax: true,
      overlay: false,
      overlayOpacity: 0.3,
      height: 150,
      particleEffect: 'stars',
    },
    roleStyles: [
      { id: 'member', name: 'Member', color: '#B3B3B3', badgeStyle: 'pill', glowEffect: false },
      {
        id: 'mod',
        name: 'Moderator',
        color: '#03DAC6',
        badgeStyle: 'shield',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'admin',
        name: 'Admin',
        color: '#CF6679',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'shimmer',
      },
      {
        id: 'owner',
        name: 'Owner',
        color: '#BB86FC',
        badgeStyle: 'diamond',
        glowEffect: true,
        animation: 'rainbow',
      },
    ],
    customCss: '',
    isPublic: true,
  },

  cyberpunk: {
    name: 'Cyberpunk 2077',
    preset: 'cyberpunk',
    colors: {
      primary: '#00F0FF',
      secondary: '#FF00FF',
      accent: '#FCEE0A',
      background: '#0A0A0F',
      surface: '#15151F',
      elevated: '#1F1F2E',
      textPrimary: '#FFFFFF',
      textSecondary: '#00F0FF',
      textMuted: '#666680',
      border: '#00F0FF33',
      divider: '#FF00FF22',
      success: '#00FF88',
      warning: '#FCEE0A',
      error: '#FF0055',
      info: '#00F0FF',
      memberColor: '#888899',
      modColor: '#00FF88',
      adminColor: '#FF00FF',
      ownerColor: '#FCEE0A',
    },
    fontFamily: '"Rajdhani", sans-serif',
    headerFontFamily: '"Orbitron", sans-serif',
    fontSize: 'md',
    borderRadius: 'none',
    borderWidth: 2,
    glassmorphism: true,
    shadows: 'dramatic',
    titleAnimation: 'neon-flicker',
    titleAnimationSpeed: 0.5,
    banner: {
      type: 'animated',
      gradient: 'linear-gradient(45deg, #0A0A0F, #15151F, #FF00FF22, #0A0A0F)',
      parallax: true,
      overlay: true,
      overlayOpacity: 0.2,
      height: 180,
      particleEffect: 'matrix',
    },
    roleStyles: [
      { id: 'member', name: 'Citizen', color: '#888899', badgeStyle: 'pill', glowEffect: false },
      {
        id: 'mod',
        name: 'NetRunner',
        color: '#00FF88',
        badgeStyle: 'shield',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'admin',
        name: 'Corpo',
        color: '#FF00FF',
        badgeStyle: 'star',
        glowEffect: true,
        animation: 'shimmer',
      },
      {
        id: 'owner',
        name: 'Legend',
        color: '#FCEE0A',
        badgeStyle: 'diamond',
        glowEffect: true,
        animation: 'rainbow',
      },
    ],
    customCss: `
      /* Cyberpunk scanlines */
      .forum-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 240, 255, 0.03) 2px,
          rgba(0, 240, 255, 0.03) 4px
        );
        pointer-events: none;
      }
    `,
    isPublic: true,
  },

  'fantasy-guild': {
    name: 'Fantasy Guild',
    preset: 'fantasy-guild',
    colors: {
      primary: '#8B4513',
      secondary: '#DAA520',
      accent: '#228B22',
      background: '#F5F5DC',
      surface: '#FAEBD7',
      elevated: '#FFFAF0',
      textPrimary: '#3E2723',
      textSecondary: '#5D4037',
      textMuted: '#8D6E63',
      border: '#D2B48C',
      divider: '#DEB887',
      success: '#228B22',
      warning: '#DAA520',
      error: '#8B0000',
      info: '#4682B4',
      memberColor: '#5D4037',
      modColor: '#228B22',
      adminColor: '#8B0000',
      ownerColor: '#DAA520',
    },
    fontFamily: '"Crimson Text", serif',
    headerFontFamily: '"Cinzel", serif',
    fontSize: 'lg',
    borderRadius: 'sm',
    borderWidth: 2,
    glassmorphism: false,
    shadows: 'medium',
    titleAnimation: 'gradient',
    titleAnimationSpeed: 3,
    banner: {
      type: 'image',
      url: '/banners/fantasy-guild.jpg',
      parallax: true,
      overlay: true,
      overlayOpacity: 0.4,
      height: 200,
    },
    roleStyles: [
      {
        id: 'member',
        name: 'Adventurer',
        color: '#5D4037',
        badgeStyle: 'shield',
        glowEffect: false,
      },
      {
        id: 'mod',
        name: 'Knight',
        color: '#228B22',
        badgeStyle: 'shield',
        glowEffect: false,
        animation: 'none',
      },
      {
        id: 'admin',
        name: 'Archmage',
        color: '#8B0000',
        badgeStyle: 'star',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'owner',
        name: 'Guild Master',
        color: '#DAA520',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'shimmer',
      },
    ],
    customCss: '',
    isPublic: true,
  },

  'minimal-pro': {
    name: 'Minimal Pro',
    preset: 'minimal-pro',
    colors: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#0066FF',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      elevated: '#FFFFFF',
      textPrimary: '#111111',
      textSecondary: '#444444',
      textMuted: '#888888',
      border: '#E5E5E5',
      divider: '#F0F0F0',
      success: '#00C853',
      warning: '#FF9100',
      error: '#FF1744',
      info: '#0066FF',
      memberColor: '#666666',
      modColor: '#00C853',
      adminColor: '#FF1744',
      ownerColor: '#0066FF',
    },
    fontFamily: '"SF Pro Display", -apple-system, sans-serif',
    headerFontFamily: '"SF Pro Display", -apple-system, sans-serif',
    fontSize: 'md',
    borderRadius: 'md',
    borderWidth: 1,
    glassmorphism: false,
    shadows: 'subtle',
    titleAnimation: 'none',
    titleAnimationSpeed: 1,
    banner: {
      type: 'gradient',
      gradient: 'linear-gradient(180deg, #FAFAFA, #FFFFFF)',
      parallax: false,
      overlay: false,
      overlayOpacity: 0,
      height: 80,
    },
    roleStyles: [
      { id: 'member', name: 'Member', color: '#666666', badgeStyle: 'none', glowEffect: false },
      { id: 'mod', name: 'Moderator', color: '#00C853', badgeStyle: 'pill', glowEffect: false },
      { id: 'admin', name: 'Admin', color: '#FF1744', badgeStyle: 'pill', glowEffect: false },
      { id: 'owner', name: 'Owner', color: '#0066FF', badgeStyle: 'pill', glowEffect: false },
    ],
    customCss: '',
    isPublic: true,
  },

  'retro-gaming': {
    name: 'Retro Gaming',
    preset: 'retro-gaming',
    colors: {
      primary: '#FF0080',
      secondary: '#00FF80',
      accent: '#FFFF00',
      background: '#1A1A2E',
      surface: '#16213E',
      elevated: '#0F3460',
      textPrimary: '#FFFFFF',
      textSecondary: '#00FF80',
      textMuted: '#888899',
      border: '#FF0080',
      divider: '#0F3460',
      success: '#00FF80',
      warning: '#FFFF00',
      error: '#FF0080',
      info: '#00FFFF',
      memberColor: '#888899',
      modColor: '#00FF80',
      adminColor: '#FF0080',
      ownerColor: '#FFFF00',
    },
    fontFamily: '"Press Start 2P", monospace',
    headerFontFamily: '"Press Start 2P", monospace',
    fontSize: 'sm',
    borderRadius: 'none',
    borderWidth: 4,
    glassmorphism: false,
    shadows: 'none',
    titleAnimation: 'letter-reveal',
    titleAnimationSpeed: 0.5,
    banner: {
      type: 'gradient',
      gradient: 'linear-gradient(180deg, #1A1A2E, #16213E)',
      parallax: false,
      overlay: false,
      overlayOpacity: 0,
      height: 100,
      particleEffect: 'stars',
    },
    roleStyles: [
      { id: 'member', name: 'Player 1', color: '#888899', badgeStyle: 'pill', glowEffect: false },
      {
        id: 'mod',
        name: 'Game Master',
        color: '#00FF80',
        badgeStyle: 'star',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'admin',
        name: 'Boss',
        color: '#FF0080',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'owner',
        name: 'Final Boss',
        color: '#FFFF00',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'rainbow',
      },
    ],
    customCss: `
      /* Pixel-perfect borders */
      * { image-rendering: pixelated; }
    `,
    isPublic: true,
  },

  'matrix-code': {
    name: 'Matrix Code',
    preset: 'matrix-code',
    colors: {
      primary: '#00FF41',
      secondary: '#008F11',
      accent: '#00FF41',
      background: '#0D0208',
      surface: '#0D0D0D',
      elevated: '#1A1A1A',
      textPrimary: '#00FF41',
      textSecondary: '#008F11',
      textMuted: '#003B00',
      border: '#00FF4133',
      divider: '#008F1122',
      success: '#00FF41',
      warning: '#FFFF00',
      error: '#FF0000',
      info: '#00FFFF',
      memberColor: '#008F11',
      modColor: '#00FF41',
      adminColor: '#FFFFFF',
      ownerColor: '#00FFFF',
    },
    fontFamily: '"Share Tech Mono", monospace',
    headerFontFamily: '"Share Tech Mono", monospace',
    fontSize: 'md',
    borderRadius: 'none',
    borderWidth: 1,
    glassmorphism: true,
    shadows: 'dramatic',
    titleAnimation: 'matrix',
    titleAnimationSpeed: 1,
    banner: {
      type: 'animated',
      gradient: 'linear-gradient(180deg, #0D0208, #0D0D0D)',
      parallax: false,
      overlay: false,
      overlayOpacity: 0,
      height: 150,
      particleEffect: 'matrix',
    },
    roleStyles: [
      { id: 'member', name: 'Bluepill', color: '#008F11', badgeStyle: 'pill', glowEffect: false },
      {
        id: 'mod',
        name: 'Operator',
        color: '#00FF41',
        badgeStyle: 'shield',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'admin',
        name: 'The One',
        color: '#FFFFFF',
        badgeStyle: 'star',
        glowEffect: true,
        animation: 'shimmer',
      },
      {
        id: 'owner',
        name: 'Architect',
        color: '#00FFFF',
        badgeStyle: 'diamond',
        glowEffect: true,
        animation: 'rainbow',
      },
    ],
    customCss: `
      /* Matrix rain effect handled by particle system */
    `,
    isPublic: true,
  },

  'sunset-gradient': {
    name: 'Sunset Gradient',
    preset: 'sunset-gradient',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FEC89A',
      accent: '#FFD93D',
      background: '#2D142C',
      surface: '#3D1C38',
      elevated: '#4D2848',
      textPrimary: '#FFFFFF',
      textSecondary: '#FEC89A',
      textMuted: '#AA8899',
      border: '#FF6B6B44',
      divider: '#FEC89A22',
      success: '#6BCB77',
      warning: '#FFD93D',
      error: '#FF6B6B',
      info: '#4FC3F7',
      memberColor: '#AA8899',
      modColor: '#6BCB77',
      adminColor: '#FF6B6B',
      ownerColor: '#FFD93D',
    },
    fontFamily: '"Poppins", sans-serif',
    headerFontFamily: '"Playfair Display", serif',
    fontSize: 'md',
    borderRadius: 'lg',
    borderWidth: 0,
    glassmorphism: true,
    shadows: 'medium',
    titleAnimation: 'gradient',
    titleAnimationSpeed: 4,
    banner: {
      type: 'gradient',
      gradient: 'linear-gradient(135deg, #FF6B6B, #FEC89A, #FFD93D)',
      parallax: true,
      overlay: true,
      overlayOpacity: 0.3,
      height: 180,
    },
    roleStyles: [
      { id: 'member', name: 'Member', color: '#AA8899', badgeStyle: 'pill', glowEffect: false },
      {
        id: 'mod',
        name: 'Guardian',
        color: '#6BCB77',
        badgeStyle: 'shield',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'admin',
        name: 'Sentinel',
        color: '#FF6B6B',
        badgeStyle: 'star',
        glowEffect: true,
        animation: 'shimmer',
      },
      {
        id: 'owner',
        name: 'Luminary',
        color: '#FFD93D',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'rainbow',
      },
    ],
    customCss: '',
    isPublic: true,
  },

  'arctic-frost': {
    name: 'Arctic Frost',
    preset: 'arctic-frost',
    colors: {
      primary: '#00B4D8',
      secondary: '#90E0EF',
      accent: '#CAF0F8',
      background: '#03045E',
      surface: '#0A1128',
      elevated: '#1B2838',
      textPrimary: '#CAF0F8',
      textSecondary: '#90E0EF',
      textMuted: '#4A6FA5',
      border: '#00B4D844',
      divider: '#90E0EF22',
      success: '#48CAE4',
      warning: '#F8E16C',
      error: '#FF6B9D',
      info: '#00B4D8',
      memberColor: '#4A6FA5',
      modColor: '#48CAE4',
      adminColor: '#90E0EF',
      ownerColor: '#CAF0F8',
    },
    fontFamily: '"Nunito", sans-serif',
    headerFontFamily: '"Montserrat", sans-serif',
    fontSize: 'md',
    borderRadius: 'lg',
    borderWidth: 1,
    glassmorphism: true,
    shadows: 'medium',
    titleAnimation: 'ice',
    titleAnimationSpeed: 2,
    banner: {
      type: 'gradient',
      gradient: 'linear-gradient(180deg, #03045E, #0A1128)',
      parallax: true,
      overlay: false,
      overlayOpacity: 0,
      height: 160,
      particleEffect: 'snow',
    },
    roleStyles: [
      { id: 'member', name: 'Wanderer', color: '#4A6FA5', badgeStyle: 'pill', glowEffect: false },
      {
        id: 'mod',
        name: 'Frostguard',
        color: '#48CAE4',
        badgeStyle: 'shield',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'admin',
        name: 'Ice Warden',
        color: '#90E0EF',
        badgeStyle: 'star',
        glowEffect: true,
        animation: 'shimmer',
      },
      {
        id: 'owner',
        name: 'Frost King',
        color: '#CAF0F8',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'shimmer',
      },
    ],
    customCss: '',
    isPublic: true,
  },

  volcanic: {
    name: 'Volcanic',
    preset: 'volcanic',
    colors: {
      primary: '#FF4500',
      secondary: '#FF6B00',
      accent: '#FFD700',
      background: '#1A0A00',
      surface: '#2D1508',
      elevated: '#3D1F0D',
      textPrimary: '#FFE4C4',
      textSecondary: '#FF6B00',
      textMuted: '#8B4513',
      border: '#FF450044',
      divider: '#FF6B0022',
      success: '#7CFC00',
      warning: '#FFD700',
      error: '#FF4500',
      info: '#FF8C00',
      memberColor: '#8B4513',
      modColor: '#FF6B00',
      adminColor: '#FF4500',
      ownerColor: '#FFD700',
    },
    fontFamily: '"Roboto Slab", serif',
    headerFontFamily: '"Cinzel Decorative", serif',
    fontSize: 'md',
    borderRadius: 'sm',
    borderWidth: 2,
    glassmorphism: false,
    shadows: 'dramatic',
    titleAnimation: 'fire',
    titleAnimationSpeed: 1,
    banner: {
      type: 'animated',
      gradient: 'linear-gradient(180deg, #1A0A00, #2D1508, #3D1F0D)',
      parallax: true,
      overlay: true,
      overlayOpacity: 0.2,
      height: 180,
      particleEffect: 'embers',
    },
    roleStyles: [
      { id: 'member', name: 'Ash Walker', color: '#8B4513', badgeStyle: 'pill', glowEffect: false },
      {
        id: 'mod',
        name: 'Flame Keeper',
        color: '#FF6B00',
        badgeStyle: 'shield',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'admin',
        name: 'Inferno Lord',
        color: '#FF4500',
        badgeStyle: 'star',
        glowEffect: true,
        animation: 'shimmer',
      },
      {
        id: 'owner',
        name: 'Volcano King',
        color: '#FFD700',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'rainbow',
      },
    ],
    customCss: '',
    isPublic: true,
  },

  custom: {
    name: 'Custom Theme',
    preset: 'custom',
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      accent: '#4ade80',
      background: '#0f0f0f',
      surface: '#1a1a1a',
      elevated: '#262626',
      textPrimary: '#ffffff',
      textSecondary: '#a3a3a3',
      textMuted: '#525252',
      border: '#333333',
      divider: '#262626',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#3b82f6',
      memberColor: '#a3a3a3',
      modColor: '#22c55e',
      adminColor: '#ef4444',
      ownerColor: '#eab308',
    },
    fontFamily: 'Inter, sans-serif',
    headerFontFamily: 'Inter, sans-serif',
    fontSize: 'md',
    borderRadius: 'md',
    borderWidth: 1,
    glassmorphism: true,
    shadows: 'medium',
    titleAnimation: 'glow',
    titleAnimationSpeed: 2,
    banner: {
      type: 'gradient',
      gradient: 'linear-gradient(135deg, #0f0f0f, #1a1a1a)',
      parallax: false,
      overlay: false,
      overlayOpacity: 0.5,
      height: 150,
    },
    roleStyles: [
      { id: 'member', name: 'Member', color: '#a3a3a3', badgeStyle: 'none', glowEffect: false },
      {
        id: 'mod',
        name: 'Moderator',
        color: '#22c55e',
        badgeStyle: 'shield',
        glowEffect: true,
        animation: 'pulse',
      },
      {
        id: 'admin',
        name: 'Admin',
        color: '#ef4444',
        badgeStyle: 'crown',
        glowEffect: true,
        animation: 'shimmer',
      },
      {
        id: 'owner',
        name: 'Owner',
        color: '#eab308',
        badgeStyle: 'diamond',
        glowEffect: true,
        animation: 'rainbow',
      },
    ],
    customCss: '',
    isPublic: false,
  },
};

// ==================== STORE STATE ====================

export interface ForumThemeState {
  // Current forum theme (for the active forum)
  activeForumId: string | null;
  activeTheme: ForumTheme | null;
  // User's custom themes
  customThemes: ForumTheme[];
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  // Preview mode
  previewTheme: ForumTheme | null;
  isPreviewMode: boolean;

  // Actions
  loadForumTheme: (forumId: string) => Promise<void>;
  saveForumTheme: (forumId: string, theme: Partial<ForumTheme>) => Promise<void>;
  applyPreset: (preset: ForumThemePreset) => void;
  setPreviewTheme: (theme: ForumTheme | null) => void;
  togglePreviewMode: () => void;
  updateThemeColors: (colors: Partial<ForumThemeColors>) => void;
  updateBanner: (banner: Partial<ForumBannerConfig>) => void;
  updateRoleStyle: (roleId: string, style: Partial<ForumRoleStyle>) => void;
  addCustomTheme: (theme: ForumTheme) => void;
  deleteCustomTheme: (themeId: string) => void;
  clearError: () => void;
}

// ==================== STORE IMPLEMENTATION ====================

export const useForumThemeStore = create<ForumThemeState>()(
  persist(
    (set, get) => ({
      activeForumId: null,
      activeTheme: null,
      customThemes: [],
      isLoading: false,
      isSaving: false,
      error: null,
      previewTheme: null,
      isPreviewMode: false,

      loadForumTheme: async (forumId: string) => {
        set({ isLoading: true, error: null, activeForumId: forumId });
        try {
          const response = await api.get(`/api/v1/forums/${forumId}/theme`);
          set({ activeTheme: response.data, isLoading: false });
        } catch (_error) {
          // Use default theme if API fails
          const defaultTheme: ForumTheme = {
            id: `${forumId}-default`,
            ...FORUM_THEME_PRESETS['dark-elite'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
          };
          set({ activeTheme: defaultTheme, isLoading: false });
        }
      },

      saveForumTheme: async (forumId: string, themeUpdates: Partial<ForumTheme>) => {
        const { activeTheme } = get();
        if (!activeTheme) return;

        set({ isSaving: true, error: null });
        try {
          const updatedTheme = {
            ...activeTheme,
            ...themeUpdates,
            updatedAt: new Date().toISOString(),
          };
          await api.put(`/api/v1/forums/${forumId}/theme`, updatedTheme);
          set({ activeTheme: updatedTheme, isSaving: false });
        } catch (_error) {
          // Apply optimistically
          set((state) => ({
            activeTheme: state.activeTheme ? { ...state.activeTheme, ...themeUpdates } : null,
            isSaving: false,
          }));
        }
      },

      applyPreset: (preset: ForumThemePreset) => {
        const { activeTheme } = get();
        const presetTheme = FORUM_THEME_PRESETS[preset];
        if (!activeTheme) return;

        set({
          activeTheme: {
            ...activeTheme,
            ...presetTheme,
            preset,
            id: activeTheme.id,
            createdAt: activeTheme.createdAt,
            createdBy: activeTheme.createdBy,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      setPreviewTheme: (theme: ForumTheme | null) => {
        set({ previewTheme: theme, isPreviewMode: theme !== null });
      },

      togglePreviewMode: () => {
        set((state) => ({ isPreviewMode: !state.isPreviewMode }));
      },

      updateThemeColors: (colors: Partial<ForumThemeColors>) => {
        set((state) => ({
          activeTheme: state.activeTheme
            ? {
                ...state.activeTheme,
                colors: { ...state.activeTheme.colors, ...colors },
                preset: 'custom',
              }
            : null,
        }));
      },

      updateBanner: (banner: Partial<ForumBannerConfig>) => {
        set((state) => ({
          activeTheme: state.activeTheme
            ? {
                ...state.activeTheme,
                banner: { ...state.activeTheme.banner, ...banner },
              }
            : null,
        }));
      },

      updateRoleStyle: (roleId: string, style: Partial<ForumRoleStyle>) => {
        set((state) => {
          if (!state.activeTheme) return state;

          const updatedRoleStyles = state.activeTheme.roleStyles.map((role) =>
            role.id === roleId ? { ...role, ...style } : role
          );

          return {
            activeTheme: {
              ...state.activeTheme,
              roleStyles: updatedRoleStyles,
            },
          };
        });
      },

      addCustomTheme: (theme: ForumTheme) => {
        set((state) => ({
          customThemes: [...state.customThemes, theme],
        }));
      },

      deleteCustomTheme: (themeId: string) => {
        set((state) => ({
          customThemes: state.customThemes.filter((t) => t.id !== themeId),
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cgraph-forum-themes',
      partialize: (state) => ({
        customThemes: state.customThemes,
      }),
    }
  )
);

// ==================== SELECTOR HOOKS ====================

export const useActiveForumTheme = () =>
  useForumThemeStore((state) => (state.isPreviewMode ? state.previewTheme : state.activeTheme));

export const useForumThemePresets = () => FORUM_THEME_PRESETS;

export default useForumThemeStore;
