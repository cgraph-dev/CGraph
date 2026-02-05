export type ProgressionCategory = 'achievements' | 'leaderboards' | 'quests' | 'rewards';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward: {
    xp: number;
    coins?: number;
    item?: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  isCurrentUser?: boolean;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward: {
    xp: number;
    coins?: number;
  };
  expiresAt?: Date;
}

export interface DailyReward {
  day: number;
  claimed: boolean;
  reward: {
    xp?: number;
    coins?: number;
    item?: string;
  };
}

export interface AchievementsSectionProps {
  achievements: Achievement[];
}

export interface LeaderboardsSectionProps {
  entries: LeaderboardEntry[];
  leaderboardType: 'global' | 'friends' | 'weekly';
  onTypeChange: (type: 'global' | 'friends' | 'weekly') => void;
}

export interface QuestsSectionProps {
  quests: Quest[];
}

export interface DailyRewardsSectionProps {
  rewards: DailyReward[];
  currentStreak: number;
  onClaim: (day: number) => void;
}
