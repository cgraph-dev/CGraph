/**
 * User Profile Card - Re-export from modularized module
 *
 * @module social/components/UserProfileCard
 * @see ./user-profile-card for implementation
 */

export {
  UserProfileCard,
  MiniProfileCard,
  FullProfileCard,
  useProfileCardNavigation,
  HOVER_DELAY_MS,
  DEFAULT_PLACEHOLDER_USER,
} from './user-profile-card';

export type {
  UserProfileCardProps,
  MiniProfileCardProps,
  FullProfileCardProps,
  MutualFriend,
  ProfileCardUser,
} from './user-profile-card';

export { UserProfileCard as default } from './user-profile-card';
