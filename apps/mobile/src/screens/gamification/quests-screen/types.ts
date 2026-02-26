/**
 * Types and constants for quests screen.
 * @module screens/gamification/quests-screen/types
 */

export type QuestTab = 'active' | 'daily' | 'weekly' | 'completed';

export interface QuestObjective {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'xp' | 'coins' | 'item' | 'title';
  amount: number;
  itemId?: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  objectives: QuestObjective[];
  rewards: QuestReward[];
  expiresAt: string | null;
}

export interface UserQuest {
  id: string;
  quest: Quest;
  accepted: boolean;
  progress: Record<string, number>;
  completed: boolean;
  claimed: boolean;
  acceptedAt: string;
  completedAt: string | null;
}

export const TABS: { id: QuestTab; name: string; icon: string }[] = [
  { id: 'active', name: 'Active', icon: 'play-circle' },
  { id: 'daily', name: 'Daily', icon: 'today' },
  { id: 'weekly', name: 'Weekly', icon: 'calendar' },
  { id: 'completed', name: 'Done', icon: 'checkmark-circle' },
];

export const QUEST_TYPE_COLORS: Record<string, { primary: string; secondary: string }> = {
  daily: { primary: '#10b981', secondary: '#064e3b' },
  weekly: { primary: '#3b82f6', secondary: '#1e3a8a' },
  special: { primary: '#f59e0b', secondary: '#78350f' },
};
