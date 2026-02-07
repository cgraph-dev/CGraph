import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useFriendStore } from '@/modules/social/store';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { toast } from '@/components/Toast';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';

const logger = createLogger('useProfileActions');

// ============================================================================
// Profile Data Loading Hook
// ============================================================================

interface UseProfileDataReturn {
  profile: UserProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  isLoading: boolean;
  error: string | null;
  friendshipStatus: FriendshipStatus;
  setFriendshipStatus: React.Dispatch<React.SetStateAction<FriendshipStatus>>;
  refreshProfile: () => Promise<void>;
}

export function useProfileData(
  userId: string | undefined,
  isOwnProfile: boolean,
  ownStats: { level: number; totalXP: number; loginStreak: number; totalUnlocked: number }
): UseProfileDataReturn {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/v1/users/${userId}`);
      const userData = response.data.user || response.data;

      setProfile({
        id: userData.id,
        username: userData.username,
        displayName: userData.display_name,
        avatarUrl: userData.avatar_url,
        bannerUrl: userData.banner_url,
        bio: userData.bio,
        status: userData.status || 'offline',
        statusMessage: userData.custom_status || userData.status_message,
        isVerified: userData.is_verified || false,
        isPremium: userData.is_premium || false,
        karma: userData.karma || 0,
        createdAt: userData.inserted_at || userData.created_at,
        mutualFriends: userData.mutual_friends_count,
        location: userData.location,
        website: userData.website,
        // Gamification stats (from API or own data if own profile)
        level: userData.level || (isOwnProfile ? ownStats.level : 1),
        totalXP: userData.total_xp || (isOwnProfile ? ownStats.totalXP : 0),
        currentXP: userData.current_xp || 0,
        loginStreak: userData.login_streak || (isOwnProfile ? ownStats.loginStreak : 0),
        achievementCount: userData.achievement_count || (isOwnProfile ? ownStats.totalUnlocked : 0),
        totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
        messagesSent: userData.messages_sent || 0,
        postsCreated: userData.posts_created || 0,
        friendsCount: userData.friends_count || 0,
        // Title system - equipped title ID
        equippedTitle: userData.equipped_title || userData.title_id || null,
      });

      setFriendshipStatus(userData.friendship_status || 'none');
    } catch (err) {
      logger.error('Failed to load profile:', err);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isOwnProfile, ownStats]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    setProfile,
    isLoading,
    error,
    friendshipStatus,
    setFriendshipStatus,
    refreshProfile: fetchProfile,
  };
}

// ============================================================================
// Profile Actions Hook (Friend requests, messaging, etc.)
// ============================================================================

interface UseProfileActionsReturn {
  isActioning: boolean;
  handleSendRequest: () => Promise<void>;
  handleAcceptRequest: () => Promise<void>;
  handleRemoveFriend: () => Promise<void>;
}

export function useProfileActions(
  profile: UserProfileData | null,
  setFriendshipStatus: React.Dispatch<React.SetStateAction<FriendshipStatus>>
): UseProfileActionsReturn {
  const { sendRequest, acceptRequest, removeFriend } = useFriendStore();
  const [isActioning, setIsActioning] = useState(false);

  const handleSendRequest = useCallback(async () => {
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
  }, [profile, sendRequest, setFriendshipStatus]);

  const handleAcceptRequest = useCallback(async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await acceptRequest(profile.id);
      setFriendshipStatus('friends');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  }, [profile, acceptRequest, setFriendshipStatus]);

  const handleRemoveFriend = useCallback(async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await removeFriend(profile.id);
      setFriendshipStatus('none');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  }, [profile, removeFriend, setFriendshipStatus]);

  return {
    isActioning,
    handleSendRequest,
    handleAcceptRequest,
    handleRemoveFriend,
  };
}

// ============================================================================
// Profile Edit Hook (Bio editing, avatar/banner uploads)
// ============================================================================

interface UseProfileEditReturn {
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
