/**
 * Type definitions for ChatInfoPanel module
 */

import type { UserTheme } from '@/stores/theme';

export interface UserInfo {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  level?: number;
  xp?: number;
  pulse?: number;
  streak?: number;
  onlineStatus?: 'online' | 'offline' | 'away';
  lastSeenAt?: string;
  bio?: string;
  badges?: Array<{
    id: string;
    name: string;
    emoji: string;
    rarity: string;
  }>;
  theme?: Partial<UserTheme>;
}

export interface MutualFriend {
  id: string;
  username: string;
  avatarUrl?: string;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
}

export interface SharedForum {
  id: string;
  name: string;
  icon?: string;
}

export interface ChatInfoPanelProps {
  userId: string;
  conversationId?: string;
  user: UserInfo;
  mutualFriends?: MutualFriend[];
  sharedForums?: SharedForum[];
  onClose: () => void;
  onMuteToggle?: (isMuted: boolean) => void;
  onBlock?: () => void;
  onReport?: () => void;
}
