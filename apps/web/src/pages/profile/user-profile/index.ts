/**
 * User Profile Module
 *
 * Modular components for the user profile page.
 * Main export is the UserProfile component.
 */

// Main component
export { UserProfile } from './UserProfile';

// Sub-components
export { ProfileBanner } from './ProfileBanner';
export { ProfileAvatar } from './ProfileAvatar';
export { ProfileNameSection } from './ProfileNameSection';
export { ProfileAbout } from './ProfileAbout';
export { FriendshipActions } from './FriendshipActions';

// Hooks
export { useProfileData } from './hooks/useProfileData';
export { useFileUpload } from './hooks/useFileUpload';

// Types
export type {
  ProfileEditState,
  FileUploadState,
  ProfileBannerProps,
  ProfileAvatarProps,
  ProfileNameSectionProps,
  ProfileAboutProps,
  FriendshipActionsProps,
} from './types';
