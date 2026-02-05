/**
 * UserProfile - Main profile page component
 *
 * Displays user profile information including:
 * - Banner and avatar with edit capabilities
 * - User info with verification badges and title
 * - Bio section
 * - XP progress and achievements (for own profile)
 * - Stats grid and sidebar
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { toast } from '@/shared/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import LevelProgress from '@/modules/gamification/components/LevelProgress';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';

import {
  ProfileLoadingState,
  ProfileErrorState,
  ProfileInvalidUser,
  AmbientParticles,
  ProfileStatsGrid,
  ProfileSidebar,
  EquippedBadgesShowcase,
  AchievementsShowcase,
} from '@/modules/social/components';

import { ProfileBanner } from './ProfileBanner';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileNameSection } from './ProfileNameSection';
import { FriendshipActions } from './FriendshipActions';
import { ProfileAbout } from './ProfileAbout';
import { useProfileData } from './hooks/useProfileData';

const logger = createLogger('UserProfile');

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { sendRequest, acceptRequest, removeFriend } = useFriendStore();
  const { achievements, equippedBadges } = useGamificationStore();

  const isOwnProfile = currentUser?.id === userId;

  // Profile data from custom hook
  const {
    profile,
    setProfile,
    isLoading,
    error,
    friendshipStatus,
    setFriendshipStatus,
    unlockedAchievements,
    totalUnlocked,
    showAllAchievements,
    setShowAllAchievements,
  } = useProfileData({ userId, isOwnProfile });

  // Local state
  const [editMode, setEditMode] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initialize edited bio when profile loads
  useEffect(() => {
    if (profile?.bio) {
      setEditedBio(profile.bio);
    }
  }, [profile?.bio]);

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

  // File input handlers
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

  // Friendship action handlers
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
      await acceptRequest(profile.id);
      setFriendshipStatus('friends');
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
      await removeFriend(profile.id);
      setFriendshipStatus('none');
    } catch {
      // Error handled by store
    } finally {
      setIsActioning(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages?userId=${profile?.id}`);
  };

  // Profile edit handlers
  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsActioning(true);
    try {
      await api.patch(`/api/v1/users/${profile.id}`, { bio: editedBio });
      setProfile({ ...profile, bio: editedBio });
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

  // Guard against invalid userId
  if (!userId || userId === 'undefined' || userId === 'null') {
    return <ProfileInvalidUser onGoBack={() => navigate(-1)} />;
  }

  if (isLoading) {
    return <ProfileLoadingState />;
  }

  if (error || !profile) {
    return <ProfileErrorState error={error} />;
  }

  return (
    <div className="relative flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <AmbientParticles count={15} />

      {/* Banner */}
      <ProfileBanner
        bannerUrl={profile.bannerUrl}
        isOwnProfile={isOwnProfile}
        editMode={editMode}
        isUploading={isUploadingBanner}
        isActioning={isActioning}
        onUploadClick={() => {
          bannerInputRef.current?.click();
          HapticFeedback.medium();
        }}
        onEditToggle={handleEditToggle}
        onSave={handleSaveProfile}
        onCancel={handleCancelEdit}
        bannerInputRef={bannerInputRef}
        onBannerChange={handleBannerChange}
      />

      {/* Profile Header */}
      <div className="relative z-10 mx-auto -mt-16 max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-end gap-6"
        >
          {/* Avatar */}
          <ProfileAvatar
            profile={profile}
            isOwnProfile={isOwnProfile}
            editMode={editMode}
            isUploading={isUploadingAvatar}
            avatarInputRef={avatarInputRef}
            onAvatarChange={handleAvatarChange}
            onAvatarClick={() => {
              avatarInputRef.current?.click();
              HapticFeedback.medium();
            }}
          />

          {/* Name & Actions */}
          <div className="flex flex-1 items-center justify-between pb-2">
            <ProfileNameSection profile={profile} />

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex items-center gap-3">
                <FriendshipActions
                  friendshipStatus={friendshipStatus}
                  isActioning={isActioning}
                  onSendRequest={handleSendRequest}
                  onAcceptRequest={handleAcceptRequest}
                  onRemoveFriend={handleRemoveFriend}
                  onMessage={handleMessage}
                />
              </div>
            )}

            {isOwnProfile && editMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <motion.button
                  onClick={() => navigate('/customize/identity')}
                  className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-600/20 px-4 py-2 font-medium text-purple-400 transition-colors hover:bg-purple-600/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PaintBrushIcon className="h-4 w-4" />
                  Customize
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {/* About */}
          <div className="space-y-6 md:col-span-2">
            <ProfileAbout
              bio={profile.bio}
              isOwnProfile={isOwnProfile}
              editMode={editMode}
              editedBio={editedBio}
              onBioChange={setEditedBio}
            />

            {/* XP Progress - Show for own profile */}
            {isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <LevelProgress variant="expanded" showStreak={true} />
              </motion.div>
            )}

            {/* Equipped Badges Showcase */}
            {isOwnProfile && (
              <EquippedBadgesShowcase
                equippedBadges={equippedBadges}
                achievements={achievements}
                editMode={editMode}
              />
            )}

            {/* Achievements Showcase */}
            {isOwnProfile && (
              <AchievementsShowcase
                achievements={unlockedAchievements}
                totalUnlocked={totalUnlocked}
                totalAchievements={ACHIEVEMENT_DEFINITIONS.length}
                showAll={showAllAchievements}
                onToggleShowAll={() => setShowAllAchievements(!showAllAchievements)}
              />
            )}

            {/* Stats Grid */}
            <ProfileStatsGrid profile={profile} />

            {/* Mutual Friends */}
            {profile.mutualFriends !== undefined && profile.mutualFriends > 0 && (
              <GlassCard variant="default" className="p-6">
                <h2 className="mb-3 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-lg font-semibold text-transparent">
                  Mutual Friends
                </h2>
                <p className="text-gray-400">
                  You have {profile.mutualFriends} mutual friend
                  {profile.mutualFriends !== 1 ? 's' : ''}
                </p>
              </GlassCard>
            )}
          </div>

          {/* Sidebar Info */}
          <ProfileSidebar profile={profile} />
        </motion.div>
      </div>
    </div>
  );
}
