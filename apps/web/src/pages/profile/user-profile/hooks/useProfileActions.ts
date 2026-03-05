/**
 * Profile action handlers hook.
 *
 * Extracts file upload, friendship, and edit handlers from UserProfile.
 *
 * @module pages/profile/user-profile/hooks/useProfileActions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { toast } from '@/shared/components/ui';
import { useFriendStore } from '@/modules/social/store';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

const logger = createLogger('UserProfile');

interface UseProfileActionsParams {
  profile: UserProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  isOwnProfile: boolean;
  setFriendshipStatus: (status: FriendshipStatus) => void;
}

/**
 * unknown for the profile module.
 */
/**
 * Hook for managing profile actions.
 */
export function useProfileActions({
  profile,
  setProfile,
  isOwnProfile,
  setFriendshipStatus,
}: UseProfileActionsParams) {
  const navigate = useNavigate();
  const { sendRequest, acceptRequest, declineRequest, removeFriend, blockUser, sentRequests, pendingRequests, friends, fetchSentRequests, fetchPendingRequests } = useFriendStore();

  const [editMode, setEditMode] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initialize edited bio when profile loads
  useEffect(() => {
    if (profile?.bio) {
      setEditedBio(profile.bio);
    }
  }, [profile?.bio]);

  // Ensure sent/pending requests are loaded for friendship ID lookups
  useEffect(() => {
    if (!isOwnProfile && profile) {
      fetchSentRequests();
      fetchPendingRequests();
    }
  }, [isOwnProfile, profile, fetchSentRequests, fetchPendingRequests]);

  // File upload handler
  const handleFileUpload = useCallback(
    async (file: File, type: 'avatar' | 'banner') => {
      if (!profile || !isOwnProfile) return;

      const setUploading = type === 'avatar' ? setIsUploadingAvatar : setIsUploadingBanner;
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const uploadResponse = await api.post('/api/v1/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadResponse.data.url;
        const updateField = type === 'avatar' ? 'avatar_url' : 'banner_url';

        await api.patch(`/api/v1/users/${profile.id}`, {
          user: { [updateField]: uploadedUrl },
        });

        setProfile((prev) =>
          prev ? { ...prev, [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: uploadedUrl } : null
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

  // Friendship actions
  const handleSendRequest = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await sendRequest(profile.username);
      setFriendshipStatus('pending_sent');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      // Look up the friendship ID from pending requests (backend requires friendship ID, not user ID)
      const pendingReq = pendingRequests.find((r) => r.user.id === profile.id);
      if (!pendingReq) {
        toast.error('Friend request not found. Try refreshing the page.');
        return;
      }
      await acceptRequest(pendingReq.id);
      setFriendshipStatus('friends');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      // Look up the friendship ID from pending requests (backend requires friendship ID, not user ID)
      const pendingReq = pendingRequests.find((r) => r.user.id === profile.id);
      if (!pendingReq) {
        toast.error('Friend request not found. Try refreshing the page.');
        return;
      }
      await declineRequest(pendingReq.id);
      setFriendshipStatus('none');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      // Cancel a sent request: look up the friendship ID from sentRequests,
      // then use DELETE /friends/:id (removeFriend) — the sender cannot use decline (recipient-only)
      const sentReq = sentRequests.find((r) => r.user.id === profile.id);
      if (!sentReq) {
        toast.error('Sent request not found. Try refreshing the page.');
        return;
      }
      await removeFriend(sentReq.id);
      await fetchSentRequests();
      setFriendshipStatus('none');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      // Look up the friendship ID (backend DELETE /friends/:id expects the friendship record ID, not user ID)
      const friend = friends.find((f) => f.id === profile.id);
      if (!friend?.friendshipId) {
        toast.error('Friend not found. Try refreshing the page.');
        return;
      }
      await removeFriend(friend.friendshipId);
      setFriendshipStatus('none');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleBlockUser = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await blockUser(profile.id);
      setFriendshipStatus('blocked');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages?userId=${profile?.id}`);
  };

  // Profile edit
  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await api.patch(`/api/v1/users/${profile.id}`, { bio: editedBio });
      setProfile({ ...profile, bio: editedBio });
      // Sync auth store so navbar/header reflect changes
      const { useAuthStore } = await import('@/modules/auth/store');
      useAuthStore.getState().updateUser({ bio: editedBio });
      setEditMode(false);
      HapticFeedback.success();
      toast.success('Profile updated successfully!');
    } catch (error) {
      logger.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
      HapticFeedback.error();
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedBio(profile?.bio || '');
    setEditMode(false);
    HapticFeedback.light();
  };

  const handleEditToggle = () => {
    setEditMode(true);
    HapticFeedback.medium();
  };

  return {
    editMode,
    editedBio,
    setEditedBio,
    isActioning,
    isUploadingAvatar,
    isUploadingBanner,
    avatarInputRef,
    bannerInputRef,
    handleAvatarChange,
    handleBannerChange,
    handleSendRequest,
    handleAcceptRequest,
    handleDeclineRequest,
    handleCancelRequest,
    handleRemoveFriend,
    handleBlockUser,
    handleMessage,
    handleSaveProfile,
    handleCancelEdit,
    handleEditToggle,
  };
}
