/**
 * ProfileCard - Type Definitions
 */

import type { Achievement } from '@/modules/gamification/store';
import type {
  ProfileTheme,
  ProfileCardConfig,
  ProfileHoverEffect,
  ThemePresetConfig,
} from '@/stores/theme';

// =============================================================================
// USER TYPES
// =============================================================================

export interface ProfileCardUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarBorderId?: string;
  bio?: string;
  // Gamification
  level: number;
  xp: number;
  xpToNextLevel: number;
  karma: number;
  streak: number;
  // Title/Badge
  equippedTitle?: {
    id: string;
    name: string;
    rarity: string;
    animation: { type: string; speed: number; intensity: number };
    color: string;
  };
  equippedBadges?: Achievement[];
  // Stats
  messageCount?: number;
  postCount?: number;
  friendCount?: number;
  forumCount?: number;
  // Social
  mutualFriends?: { id: string; username: string; avatarUrl: string }[];
  forumsInCommon?: { id: string; name: string }[];
  recentActivity?: { type: string; description: string; timestamp: string }[];
  socialLinks?: { platform: string; url: string }[];
  // Status
  isOnline: boolean;
  lastSeen?: string;
  pronouns?: string;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface ProfileCardProps {
  user: ProfileCardUser;
  theme?: ProfileTheme | ThemePresetConfig;
  cardConfig?: ProfileCardConfig;
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export interface LayoutProps {
  user: ProfileCardUser;
  config: ProfileCardConfig;
  sizeConfig: SizeConfig;
  theme: ProfileTheme | ThemePresetConfig | null | undefined;
}

export interface StatItemProps {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
}

// =============================================================================
// CONFIG TYPES
// =============================================================================

export interface SizeConfig {
  avatar: number;
  padding: string;
  titleSize: string;
  textSize: string;
}

export type { ProfileTheme, ProfileCardConfig, ProfileHoverEffect, ThemePresetConfig };
