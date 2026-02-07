/**
 * QuestsPage types
 * @module quests-page/types
 */

import type { Quest } from '@/modules/gamification/store';

export type QuestTab = 'active' | 'daily' | 'weekly' | 'completed';

export interface QuestCardProps {
  quest: Quest;
  onAccept?: () => void;
  onClaim?: () => void;
  isAccepting?: boolean;
  isClaiming?: boolean;
}
