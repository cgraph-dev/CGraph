/**
 * useAvatarSettings hook
 * @module modules/settings/components/avatar-settings
 */

import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { useAvatarStyle, toast } from '@/shared/components/ui';
import { useAuthStore } from '@/modules/auth/store';
import { useProfileStore } from '@/modules/social/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useSyncStatus } from '@/modules/settings/components/sync-status-indicator';
import type { AvatarSettingsFormData, FileUploadState, UseAvatarSettingsReturn } from './types';

const logger = createLogger('AvatarSettings');

/**
 * unknown for the settings module.
 */
/**
 * Hook for managing avatar settings.
 * @returns The result.
 */
export function useAvatarSettings(): UseAvatarSettingsReturn {
  const { user, updateUser } = useAuthStore();
  const { exportStyle, importStyle } = useAvatarStyle();
  const { updateProfile, uploadAvatar, uploadBanner } = useProfileStore();
  const { status: syncStatus, setSaving, setSaved, setError } = useSyncStatus();

  // Profile form state
  const [formData, setFormData] = useState<AvatarSettingsFormData>({
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    occupation: user?.occupation || '',
  });

  // Import text state
  const [importText, setImportText] = useState('');

  // File upload state
  const [avatarUpload, setAvatarUpload] = useState<FileUploadState>({
    file: null,
    preview: null,
  });
  const [bannerUpload, setBannerUpload] = useState<FileUploadState>({
    file: null,
    preview: null,
  });

  // Sync form state with user data when it changes
  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        occupation: user.occupation || '',
      });
    }
  }, [user]);

  // Handle profile update
  const handleProfileSave = async () => {
    setSaving();
    try {
      await updateProfile(formData);
      updateUser(formData);
      setSaved();
      toast.success('Profile updated successfully');
    } catch (error) {
      logger.error('Failed to update profile:', error);
      setError('Failed to save profile');
      toast.error('Failed to update profile');
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // type assertion: FileReader.result is string when readAsDataURL() is used

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        setAvatarUpload({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banner file selection
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // type assertion: FileReader.result is string when readAsDataURL() is used

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        setBannerUpload({ file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarUpload.file) return;

    setSaving();
    try {
      const newAvatarUrl = await uploadAvatar(avatarUpload.file);
      updateUser({ avatarUrl: newAvatarUrl });
      setAvatarUpload({ file: null, preview: null });
      setSaved();
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      logger.error('Failed to upload avatar:', error);
      setError('Failed to upload avatar');
      toast.error('Failed to upload avatar');
    }
  };

  // Upload banner
  const handleBannerUpload = async () => {
    if (!bannerUpload.file) return;

    setSaving();
    try {
      const newBannerUrl = await uploadBanner(bannerUpload.file);
      updateUser({ bannerUrl: newBannerUrl });
      setBannerUpload({ file: null, preview: null });
      setSaved();
      toast.success('Banner uploaded successfully');
    } catch (error) {
      logger.error('Failed to upload banner:', error);
      setError('Failed to upload banner');
      toast.error('Failed to upload banner');
    }
  };

  const clearAvatarUpload = () => {
    setAvatarUpload({ file: null, preview: null });
  };

  const clearBannerUpload = () => {
    setBannerUpload({ file: null, preview: null });
  };

  const handleExport = () => {
    const json = exportStyle();
    navigator.clipboard.writeText(json);
    HapticFeedback.success();
    alert('Avatar style copied to clipboard!');
  };

  const handleImport = () => {
    if (importText.trim()) {
      importStyle(importText);
      setImportText('');
      HapticFeedback.success();
    }
  };

  return {
    formData,
    setFormData,
    handleProfileSave,
    avatarUpload,
    handleAvatarChange,
    handleAvatarUpload,
    clearAvatarUpload,
    bannerUpload,
    handleBannerChange,
    handleBannerUpload,
    clearBannerUpload,
    importText,
    setImportText,
    handleExport,
    handleImport,
    syncStatus,
  };
}
