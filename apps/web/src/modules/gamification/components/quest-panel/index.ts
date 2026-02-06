/**
 * Quest Panel Module
 *
 * Gamification quest tracking panel with compact and full layout variants.
 * Displays active quests, objectives, progress, and rewards with
 * confetti celebrations on completion.
 *
 * @module modules/gamification/components/quest-panel
 */

// Main component
export { default } from './QuestPanel';

// Sub-components
export { CompactQuestPanel } from './CompactQuestPanel';
export { FullQuestPanel } from './FullQuestPanel';
export { QuestObjectiveItem } from './QuestObjectiveItem';

// Utilities
export { formatTimeRemaining, getQuestProgress, isQuestReady, getQuestTypeColor } from './utils';

// Types
export type { QuestPanelProps, QuestTypeColor } from './types';
