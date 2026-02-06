/**
 * leaderboard-widget Module
 *
 * Barrel exports for the LeaderboardWidget component.
 */

export { LeaderboardWidget, default } from './LeaderboardWidget';
export { Podium } from './Podium';
export { LeaderboardEntryRow } from './LeaderboardEntryRow';
export { SidebarVariant } from './SidebarVariant';
export { RANK_COLORS, LEADERBOARD_TYPES, TIME_PERIODS } from './constants';
export { getRankChange, formatScore, getScoreLabel } from './utils';
export type {
  LeaderboardEntry,
  LeaderboardWidgetProps,
  LeaderboardEntryProps,
  PodiumProps,
  LeaderboardType,
  TimePeriod,
  WidgetVariant,
  LeaderboardTypeOption,
  TimePeriodOption,
} from './types';
