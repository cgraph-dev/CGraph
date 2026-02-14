/**
 * Forum Leaderboard Component
 *
 * Competitive ranking of forums by upvotes.
 *
 * Modularized into forum-leaderboard/ directory:
 * - types.ts: LeaderboardSort, SortOption, CardProps interfaces
 * - constants.ts: SORT_OPTIONS, getRankBadge, getRankColor
 * - ForumLeaderboardCard.tsx: Individual forum card with voting
 * - TopForumCard.tsx: Compact Hall of Fame card
 * - LeaderboardSidebar.tsx: Hall of Fame and How It Works sections
 * - ForumLeaderboard.tsx: Main page component
 */
export { default } from './forum-leaderboard';
export * from './forum-leaderboard';
