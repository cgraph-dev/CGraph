/**
 * Gamification Components - Mobile
 * 
 * Central export for all gamification-related UI components.
 * These components form the core engagement system that rewards
 * users for participation and creates a compelling user experience.
 * 
 * Components:
 * - AchievementNotification: Toast notifications for unlocked achievements
 * - LevelProgress: XP bar and level display with animations
 * - LevelUpModal: Full-screen celebration for level advancement
 * - QuestPanel: Daily/weekly/special quest tracking interface
 * - TitleBadge: User title display with animated effects
 * 
 * @version 1.0.0
 * @since v0.8.1
 */

// Achievement system
export { default as AchievementNotification } from './achievement-notification';
export type { Achievement, AchievementRarity } from './achievement-notification';

// Level and XP system
export { default as LevelProgress } from './level-progress';
export { default as LevelUpModal } from './level-up-modal';

// XP Toast
export { default as XPToast, useXPToastQueue } from './xp-toast';
export type { XPToastData, XPToastType } from './xp-toast';

// Quest system
export { default as QuestPanel } from './quest-panel';
export type { Quest, QuestType, QuestStatus, QuestReward } from './quest-panel';

// Streak tracking
export { default as StreakDisplay } from './streak-display';
export type { StreakDisplayProps } from './streak-display';

// Level gate (progressive disclosure)
export { default as LevelGate, useLevelGate } from './level-gate';
export type { LevelGateProps, LevelGateResult } from './level-gate';

// Titles and badges
export { default as TitleBadge } from './title-badge';
