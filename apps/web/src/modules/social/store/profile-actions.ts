/**
 * Profile store action creators.
 * @module
 */
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { StoreApi } from 'zustand';
import type {
  UserSignature,
  UpdateProfileData,
  UpdateSignatureData,
  UpdatePrivacySettings,
  ProfileState,
} from './profileStore.types';
import { mapProfileFromApi } from './profile-mappers';

const logger = createLogger('profileStore');

type Set = StoreApi<ProfileState>['setState'];

/** Fetch a user's profile by ID. */
export function createFetchProfile(set: Set) {
  return async (userId: string) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const response = await api.get(`/api/v1/users/${userId}`);
      const profile = mapProfileFromApi(response.data);
      set({ currentProfile: profile, isLoadingProfile: false });
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      set({ profileError: message, isLoadingProfile: false });
      throw error;
    }
  };
}

/** Fetch the authenticated user's own profile. */
export function createFetchMyProfile(set: Set) {
  return async () => {
    try {
      const response = await api.get('/api/v1/users/me');
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile, mySignature: profile.signature });
    } catch (error) {
      logger.error('Failed to fetch my profile:', error);
      throw error;
    }
  };
}

/** Update the authenticated user's profile. */
export function createUpdateProfile(set: Set) {
  return async (data: UpdateProfileData) => {
    try {
      const payload: Record<string, unknown> = {};

      if (data.displayName !== undefined) payload.display_name = data.displayName;
      if (data.bio !== undefined) payload.bio = data.bio;
      if (data.location !== undefined) payload.location = data.location;
      if (data.website !== undefined) payload.website = data.website;
      if (data.occupation !== undefined) payload.occupation = data.occupation;
      if (data.interests !== undefined) payload.interests = data.interests;
      if (data.birthDate !== undefined) payload.birth_date = data.birthDate;
      if (data.showBirthDate !== undefined) payload.show_birth_date = data.showBirthDate;
      if (data.gender !== undefined) payload.gender = data.gender;
      if (data.socialLinks !== undefined) {
        payload.twitter = data.socialLinks.twitter;
        payload.github = data.socialLinks.github;
        payload.discord = data.socialLinks.discord;
        payload.youtube = data.socialLinks.youtube;
        payload.twitch = data.socialLinks.twitch;
        payload.instagram = data.socialLinks.instagram;
        payload.linkedin = data.socialLinks.linkedin;
      }
      if (data.customFields !== undefined) {
        payload.custom_fields = data.customFields.map((f) => ({
          field_id: f.fieldId,
          value: f.value,
        }));
      }

      const response = await api.put('/api/v1/users/me', { user: payload });
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      logger.error('Failed to update profile:', error);
      throw error;
    }
  };
}

/** Update the user's signature. */
export function createUpdateSignature(set: Set) {
  return async (data: UpdateSignatureData) => {
    try {
      const response = await api.put('/api/v1/users/me/signature', {
        signature: {
          enabled: data.enabled,
          content: data.content,
        },
      });
      const signature: UserSignature = {
        enabled: response.data.enabled,
        content: response.data.content,
        maxLength: response.data.max_length || 500,
      };
      set((state) => ({
        mySignature: signature,
        myProfile: state.myProfile ? { ...state.myProfile, signature } : null,
      }));
    } catch (error) {
      logger.error('Failed to update signature:', error);
      throw error;
    }
  };
}

/** Update privacy settings. */
export function createUpdatePrivacySettings(set: Set) {
  return async (data: UpdatePrivacySettings) => {
    try {
      const payload: Record<string, unknown> = {};
      if (data.isProfilePrivate !== undefined) payload.is_profile_private = data.isProfilePrivate;
      if (data.showOnlineStatus !== undefined) payload.show_online_status = data.showOnlineStatus;
      if (data.showLastActive !== undefined) payload.show_last_active = data.showLastActive;
      if (data.showEmail !== undefined) payload.show_email = data.showEmail;
      if (data.showLocation !== undefined) payload.show_location = data.showLocation;

      const response = await api.put('/api/v1/users/me/privacy', { privacy: payload });
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      logger.error('Failed to update privacy settings:', error);
      throw error;
    }
  };
}

/** Equip or unequip a title. */
export function createEquipTitle(set: Set) {
  return async (titleId: string | null) => {
    try {
      const response = await api.put('/api/v1/users/me/title', {
        title_id: titleId,
      });
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      logger.error('Failed to equip title:', error);
      throw error;
    }
  };
}

/** Equip a badge. */
export function createEquipBadge(set: Set) {
  return async (badgeId: string) => {
    try {
      const response = await api.post('/api/v1/users/me/badges/equip', {
        badge_id: badgeId,
      });
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      logger.error('Failed to equip badge:', error);
      throw error;
    }
  };
}

/** Unequip a badge. */
export function createUnequipBadge(set: Set) {
  return async (badgeId: string) => {
    try {
      const response = await api.delete(`/api/v1/users/me/badges/equip/${badgeId}`);
      const profile = mapProfileFromApi(response.data);
      set({ myProfile: profile });
    } catch (error) {
      logger.error('Failed to unequip badge:', error);
      throw error;
    }
  };
}
