import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

/**
 * Profile edit mode state
 */
export interface ProfileEditState {
  editMode: boolean;
  editedBio: string;
  isActioning: boolean;
}

/**
 * File upload state for avatar and banner
 */
export interface FileUploadState {
  isUploadingAvatar: boolean;
  isUploadingBanner: boolean;
}

/**
 * Props for ProfileBanner component
 */
export interface ProfileBannerProps {
  bannerUrl?: string;
  isOwnProfile: boolean;
  editMode: boolean;
  isUploading: boolean;
  onUploadClick: () => void;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  isActioning: boolean;
  bannerInputRef: React.RefObject<HTMLInputElement | null>;
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Props for ProfileHeader component
 */
export interface ProfileHeaderProps {
  profile: UserProfileData;
  isOwnProfile: boolean;
  editMode: boolean;
  isUploadingAvatar: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarClick: () => void;
}

/**
 * Props for FriendshipActions component
 */
export interface FriendshipActionsProps {
  profile: UserProfileData;
  friendshipStatus: FriendshipStatus;
  isActioning: boolean;
  onSendRequest: () => void;
  onAcceptRequest: () => void;
  onRemoveFriend: () => void;
  onMessage: () => void;
}

/**
 * Props for ProfileEditActions component
 */
export interface ProfileEditActionsProps {
  editMode: boolean;
  onNavigateCustomize: () => void;
}

/**
 * Props for ProfileAbout component
 */
export interface ProfileAboutProps {
  bio?: string;
  isOwnProfile: boolean;
  editMode: boolean;
  editedBio: string;
  onBioChange: (value: string) => void;
}

// Re-export profile types for convenience
export type { UserProfileData, FriendshipStatus };
