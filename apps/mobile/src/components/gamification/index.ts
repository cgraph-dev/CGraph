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
export { default as AchievementNotification } from './AchievementNotification';
export type { Achievement, AchievementRarity } from './AchievementNotification';

// Level and XP system
export { default as LevelProgress } from './LevelProgress';
export { default as LevelUpModal } from './LevelUpModal';

// Quest system
export { default as QuestPanel } from './QuestPanel';
export type { Quest, QuestType, QuestStatus, QuestReward } from './QuestPanel';

// Titles and badges
export { default as TitleBadge } from './TitleBadge';
