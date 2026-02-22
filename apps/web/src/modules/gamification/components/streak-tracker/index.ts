/**
 * Streak Tracker Module
 */

export { default, StreakTracker } from './streak-tracker';

// Components
export { FireAnimation } from './fire-animation';
export { WeeklyCalendar } from './weekly-calendar';
export { MilestoneProgress } from './milestone-progress';
export { ClaimableMilestones } from './claimable-milestones';
export { MilestonesList } from './milestones-list';
export { StreakWidgetVariant, StreakCompactVariant } from './streak-variants';

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
