/**
 * Quest Panel Module Types
 *
 * Type definitions for the quest tracking panel components.
 *
 * @module modules/gamification/components/quest-panel
 */

import type { Quest } from '@/modules/gamification/store';

export interface QuestPanelProps {
  /** Display variant: 'compact' for sidebar, 'full' for dedicated page */
  variant?: 'compact' | 'full';
  /** Maximum number of quests to display */
  maxQuests?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback fired when a quest is completed */
  onQuestComplete?: (quest: Quest) => void;
}

export interface QuestTypeColor {
  /** Background color class */
  bg: string;
  /** Border color class */
  border: string;
  /** Text color class */
  text: string;
}
