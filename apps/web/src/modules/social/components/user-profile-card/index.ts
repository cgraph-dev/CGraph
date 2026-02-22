/**
 * User Profile Card Module
 *
 * Profile card with hover and click triggers
 */

// Main component
export { default as UserProfileCard } from './user-profile-card';

// Sub-components
export { MiniProfileCard } from './mini-profile-card';
export { FullProfileCard } from './full-profile-card';

// Types
export type {
  UserProfileCardProps,
  MiniProfileCardProps,
  FullProfileCardProps,
  MutualFriend,
  CardPosition,
  ProfileCardUser,
} from './types';

// Hooks
export { useProfileCardNavigation, useUserBorder } from './hooks';

// Constants
export {
  HOVER_DELAY_MS,
  DEFAULT_PLACEHOLDER_USER,
  MAX_MUTUAL_FRIENDS_DISPLAY,
  MAX_BADGES_DISPLAY,
  MAX_SHARED_FORUMS_DISPLAY,
} from './constants';
