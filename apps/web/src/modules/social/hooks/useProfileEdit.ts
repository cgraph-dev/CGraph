/**
 * Hook for profile editing state.
 * @module
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { toast } from '@/components/feedback/toast';
import type { UserProfileData } from '@/types/profile.types';

const logger = createLogger('useProfileActions');

// ============================================================================
// Profile Edit Hook (Bio editing, avatar/banner uploads)
// ============================================================================

export interface UseProfileEditReturn {
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  editedBio: string;
  setEditedBio: React.Dispatch<React.SetStateAction<string>>;
  isUploadingAvatar: boolean;
  isUploadingBanner: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  bannerInputRef: React.RefObject<HTMLInputElement | null>;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: () => Promise<void>;
  handleCancelEdit: () => void;
  isSaving: boolean;
}

/**
 * unknown for the social module.
 */
/**
 * Hook for managing profile edit.
 *
 * @param profile - The profile.
 * @param setProfile - The set profile.
 * @param isOwnProfile - The is own profile.
 */
export function useProfileEdit(
  profile: UserProfileData | null,
  setProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>,
  isOwnProfile: boolean
): UseProfileEditReturn {
  const [editMode, setEditMode] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initialize edited bio when profile loads
  useEffect(() => {
    if (profile?.bio) {
      setEditedBio(profile.bio);
    }
  }, [profile?.bio]);

  // File upload handler for avatar/banner
  const handleFileUpload = useCallback(
    async (file: File, type: 'avatar' | 'banner') => {
      if (!profile || !isOwnProfile) return;

      const setUploading = type === 'avatar' ? setIsUploadingAvatar : setIsUploadingBanner;
      setUploading(true);

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        // Upload the file
        const uploadResponse = await api.post('/api/v1/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const uploadedUrl = uploadResponse.data.url;

        // Update user profile with the new URL
        const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url';
        await api.patch(`/api/v1/users/${profile.id}`, {
          user: {
            [updateField]: uploadedUrl,
          },
        });

        // Update local state
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: uploadedUrl,
              }
            : null
        );

        HapticFeedback.success();
        toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully!`);
      } catch (err) {
        logger.error(`Failed to upload ${type}:`, err);
        toast.error(`Failed to upload ${type}. Please try again.`);
        HapticFeedback.error();
      } finally {
        setUploading(false);
      }
    },
    [profile, isOwnProfile, setProfile]
  );

  // Handle file input change for avatar
  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image must be less than 5MB');
          return;
        }
        handleFileUpload(file, 'avatar');
      }
      e.target.value = '';
    },
    [handleFileUpload]
  );

  // Handle file input change for banner
  const handleBannerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Image must be less than 10MB');
          return;
        }
        handleFileUpload(file, 'banner');
      }
      e.target.value = '';
    },
    [handleFileUpload]
  );

  const handleSaveProfile = useCallback(async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await api.patch(`/api/v1/users/${profile.id}`, {
        bio: editedBio,
      });
      setProfile((prev) => (prev ? { ...prev, bio: editedBio } : null));
      setEditMode(false);
      HapticFeedback.success();
      toast.success('Profile updated successfully!');
    } catch (error) {
      logger.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
      HapticFeedback.error();
    } finally {
      setIsSaving(false);
    }
  }, [profile, editedBio, setProfile]);

  const handleCancelEdit = useCallback(() => {
    setEditedBio(profile?.bio || '');
    setEditMode(false);
    HapticFeedback.light();
  }, [profile?.bio]);

  return {
    editMode,
    setEditMode,
    editedBio,
    setEditedBio,
    isUploadingAvatar,
    isUploadingBanner,
    avatarInputRef,
    bannerInputRef,
    handleAvatarChange,
    handleBannerChange,
    handleSaveProfile,
    handleCancelEdit,
    isSaving,
  };
}
