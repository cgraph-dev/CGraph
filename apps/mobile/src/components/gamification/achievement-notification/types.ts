import { Ionicons } from '@expo/vector-icons';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  maxProgress: number;
  category: string;
}

export interface AchievementNotificationData {
  achievement: Achievement & {
    progress: number;
    unlocked: boolean;
    unlockedAt?: string;
  };
  isUnlock: boolean;
}

export interface AchievementNotificationProps {
  notifications: AchievementNotificationData[];
  onDismiss: (index: number) => void;
  onViewDetails?: (achievement: Achievement) => void;
}

export const RARITY_CONFIG: Record<AchievementRarity, {
  colors: [string, string];
  glowColor: string;
  particleCount: number;
  iconName: keyof typeof Ionicons.glyphMap;
}> = {
  common: {
    colors: ['#6b7280', '#4b5563'],
    glowColor: 'rgba(107, 114, 128, 0.5)',
    particleCount: 8,
    iconName: 'ribbon-outline',
  },
  uncommon: {
    colors: ['#10b981', '#059669'],
    glowColor: 'rgba(16, 185, 129, 0.5)',
    particleCount: 12,
    iconName: 'ribbon',
  },
  rare: {
    colors: ['#3b82f6', '#2563eb'],
    glowColor: 'rgba(59, 130, 246, 0.5)',
    particleCount: 16,
    iconName: 'medal-outline',
  },
  epic: {
    colors: ['#8b5cf6', '#7c3aed'],
    glowColor: 'rgba(139, 92, 246, 0.5)',
    particleCount: 20,
    iconName: 'medal',
  },
  legendary: {
    colors: ['#f59e0b', '#d97706'],
    glowColor: 'rgba(245, 158, 11, 0.5)',
    particleCount: 30,
    iconName: 'trophy',
  },
  mythic: {
    colors: ['#ec4899', '#db2777'],
    glowColor: 'rgba(236, 72, 153, 0.5)',
    particleCount: 40,
    iconName: 'diamond',
  },
};
