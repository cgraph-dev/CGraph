import type { Quest } from '@/stores/gamificationStore';

export interface QuestPanelProps {
  variant?: 'compact' | 'full';
  maxQuests?: number;
  className?: string;
  onQuestComplete?: (quest: Quest) => void;
}

export interface QuestTypeColor {
  bg: string;
  border: string;
  text: string;
}
