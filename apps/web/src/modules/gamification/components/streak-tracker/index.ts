/**
 * Streak Tracker Module
 */

export { default, StreakTracker } from './StreakTracker';

// Components
export { FireAnimation } from './FireAnimation';
export { WeeklyCalendar } from './WeeklyCalendar';
export { MilestoneProgress } from './MilestoneProgress';
export { ClaimableMilestones } from './ClaimableMilestones';
export { MilestonesList } from './MilestonesList';
export { StreakWidgetVariant, StreakCompactVariant } from './StreakVariants';

// Constants
export { DEFAULT_MILESTONES, FIRE_COLORS, GLOW_COLOR } from './constants';

// Types
export type {
  StreakDay,
  StreakMilestone,
  StreakTrackerVariant,
  StreakTrackerProps,
  FireAnimationProps,
  WeeklyCalendarProps,
  MilestoneProgressProps,
  ClaimableMilestonesProps,
  MilestonesListProps,
} from './types';
