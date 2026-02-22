/**
 * Achievements Page
 *
 * Full achievements browser with category filtering, progress tracking,
 * and unlock celebrations. Connects to gamificationStore for real-time data.
 *
 * Modularized into achievements-page/ directory:
 * - types.ts: Type definitions
 * - constants.tsx: Categories, rarity colors, rarity order
 * - AchievementCard.tsx: Individual achievement card component
 * - AchievementDetailModal.tsx: Modal for achievement details
 * - useAchievementStats.ts: Hook for computing achievement statistics
 * - AchievementsPage.tsx: Main page component
 *
 * @version 1.0.0
 * @since v0.8.3
 */
export { default } from './achievements-page/index';
export * from './achievements-page/index';
