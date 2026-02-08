import { create } from 'zustand';

// Re-export all types from the types file
export type {
  UserSignature,
  ProfileField,
  UserBadge,
  UserTitle,
  UserStars,
  ExtendedProfile,
  BlockedUser,
  UpdateProfileData,
  UpdateSignatureData,
  UpdatePrivacySettings,
  ProfileState,
} from './profileStore.types';

import type { ProfileState } from './profileStore.types';

// Re-export mapper for external consumers
export { mapProfileFromApi } from './profile-mappers';

import {
  createFetchProfile,
  createFetchMyProfile,
  createUpdateProfile,
  createUpdateSignature,
  createUpdatePrivacySettings,
  createEquipTitle,
  createEquipBadge,
  createUnequipBadge,
} from './profile-actions';

import {
  createFetchBlockedUsers,
  createBlockUser,
  createUnblockUser,
  createIsUserBlocked,
  createUploadAvatar,
  createUploadBanner,
  createFetchProfileFields,
  createClearProfile,
} from './profile-blocked-and-media';

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  currentProfile: null,
  isLoadingProfile: false,
  profileError: null,
  myProfile: null,
  mySignature: null,
  blockedUsers: [],
  isLoadingBlocked: false,
  availableFields: [],

  // Profile actions
  fetchProfile: createFetchProfile(set),
  fetchMyProfile: createFetchMyProfile(set),
  updateProfile: createUpdateProfile(set),
  updateSignature: createUpdateSignature(set),
  updatePrivacySettings: createUpdatePrivacySettings(set),

  // Title & badges
  equipTitle: createEquipTitle(set),
  equipBadge: createEquipBadge(set),
  unequipBadge: createUnequipBadge(set),

  // Block/ignore
  fetchBlockedUsers: createFetchBlockedUsers(set),
  blockUser: createBlockUser(set, get),
  unblockUser: createUnblockUser(set, get),
  isUserBlocked: createIsUserBlocked(get),

  // Avatar/banner upload
  uploadAvatar: createUploadAvatar(set),
  uploadBanner: createUploadBanner(set),

  // Profile fields
  fetchProfileFields: createFetchProfileFields(set),

  // Clear state
  clearProfile: createClearProfile(set),
}));

export default useProfileStore;
