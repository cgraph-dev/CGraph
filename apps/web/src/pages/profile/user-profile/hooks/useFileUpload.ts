/**
 * Custom hook for managing profile file uploads (avatar/banner)
 */

import { useCallback, useRef } from 'react';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { toast } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { UserProfileData } from '../types';

const logger = createLogger('useFileUpload');

/**
 * Configuration for file uploads
 */
const FILE_LIMITS = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    sizeLabel: '5MB',
  },
  banner: {
    maxSize: 10 * 1024 * 1024, // 10MB
    sizeLabel: '10MB',
  },
};

interface UseFileUploadOptions {
  profile: UserProfileData | null;
  isOwnProfile: boolean;
  onProfileUpdate: (updates: Partial<UserProfileData>) => void;
}

interface UseFileUploadReturn {
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  bannerInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingAvatar: boolean;
  isUploadingBanner: boolean;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerAvatarUpload: () => void;
  triggerBannerUpload: () => void;
}

export function useFileUpload({
  profile,
  isOwnProfile,
  onProfileUpdate,
}: UseFileUploadOptions): UseFileUploadReturn {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // Track upload state (using refs to avoid re-renders, state managed by parent)
  const uploadState = useRef({
    isUploadingAvatar: false,
    isUploadingBanner: false,
  });

  /**
   * Upload a file (avatar or banner) to the server
   */
  const handleFileUpload = useCallback(
    async (file: File, type: 'avatar' | 'banner') => {
      if (!profile || !isOwnProfile) return;

      const stateKey = type === 'avatar' ? 'isUploadingAvatar' : 'isUploadingBanner';
      uploadState.current[stateKey] = true;

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
        const profileKey = type === 'avatar' ? 'avatarUrl' : 'bannerUrl';
        onProfileUpdate({ [profileKey]: uploadedUrl });

        HapticFeedback.success();
        toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully!`);
      } catch (err) {
        logger.error(`Failed to upload ${type}:`, err);
        toast.error(`Failed to upload ${type}. Please try again.`);
        HapticFeedback.error();
      } finally {
        uploadState.current[stateKey] = false;
      }
    },
    [profile, isOwnProfile, onProfileUpdate]
  );

  /**
   * Validate and handle avatar file selection
   */
  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }
        // Validate file size
        if (file.size > FILE_LIMITS.avatar.maxSize) {
          toast.error(`Image must be less than ${FILE_LIMITS.avatar.sizeLabel}`);
          return;
        }
        handleFileUpload(file, 'avatar');
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFileUpload]
  );

  /**
   * Validate and handle banner file selection
   */
  const handleBannerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select an image file');
          return;
        }
        // Validate file size
        if (file.size > FILE_LIMITS.banner.maxSize) {
          toast.error(`Image must be less than ${FILE_LIMITS.banner.sizeLabel}`);
          return;
        }
        handleFileUpload(file, 'banner');
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFileUpload]
  );

  const triggerAvatarUpload = useCallback(() => {
    avatarInputRef.current?.click();
    HapticFeedback.medium();
  }, []);

  const triggerBannerUpload = useCallback(() => {
    bannerInputRef.current?.click();
    HapticFeedback.medium();
  }, []);

  return {
    avatarInputRef,
    bannerInputRef,
    isUploadingAvatar: uploadState.current.isUploadingAvatar,
    isUploadingBanner: uploadState.current.isUploadingBanner,
    handleAvatarChange,
    handleBannerChange,
    triggerAvatarUpload,
    triggerBannerUpload,
  };
}
