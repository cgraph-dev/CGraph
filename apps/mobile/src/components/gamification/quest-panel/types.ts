/**
 * QuestPanel Types
 */

export type QuestType = 'daily' | 'weekly' | 'special' | 'story';
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'claimed' | 'locked';

export interface QuestReward {
  type: 'xp' | 'coins' | 'badge' | 'title' | 'item';
  amount?: number;
  id?: string;
  name?: string;
  icon?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  currentProgress: number;
  targetProgress: number;
  rewards: QuestReward[];
  expiresAt?: string;
  unlocksAt?: string;
  prerequisiteQuestId?: string;
  iconName: string;
}

export interface QuestPanelProps {
  quests: Quest[];
  onClaimQuest: (questId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  showHeader?: boolean;
  maxHeight?: number;
}

export interface CountdownTimerProps {
  expiresAt: string;
  compact?: boolean;
}

export interface QuestProgressBarProps {
  current: number;
  target: number;
  colors: readonly [string, string, ...string[]];
}

export interface RewardBadgeProps {
  reward: QuestReward;
}

export interface QuestCardProps {
  quest: Quest;
  onClaim: (questId: string) => Promise<void>;
}

export interface QuestSectionProps {
  type: QuestType;
  quests: Quest[];
  onClaim: (questId: string) => Promise<void>;
  initialExpanded?: boolean;
}
