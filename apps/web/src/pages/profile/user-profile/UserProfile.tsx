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

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { useGamificationStore } from '@/modules/gamification/store';
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
import { useProfileActions } from './hooks/useProfileActions';

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { achievements, equippedBadges } = useGamificationStore();

  const isOwnProfile = currentUser?.id === userId;

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

  const actions = useProfileActions({
    profile,
    setProfile,
    isOwnProfile,
    setFriendshipStatus,
  });

  // Guard against invalid userId
  if (!userId || userId === 'undefined' || userId === 'null') {
    return <ProfileInvalidUser onGoBack={() => navigate(-1)} />;
  }

  if (isLoading) return <ProfileLoadingState />;
  if (error || !profile) return <ProfileErrorState error={error} />;

  return (
    <div className="relative flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <AmbientParticles count={15} />

      <ProfileBanner
        bannerUrl={profile.bannerUrl ?? undefined}
        isOwnProfile={isOwnProfile}
        editMode={actions.editMode}
        isUploading={actions.isUploadingBanner}
        isActioning={actions.isActioning}
        onUploadClick={() => {
          actions.bannerInputRef.current?.click();
          HapticFeedback.medium();
        }}
        onEditToggle={actions.handleEditToggle}
        onSave={actions.handleSaveProfile}
        onCancel={actions.handleCancelEdit}
        bannerInputRef={actions.bannerInputRef}
        onBannerChange={actions.handleBannerChange}
      />

      <div className="relative z-10 mx-auto -mt-16 max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-end gap-6"
        >
          <ProfileAvatar
            profile={profile}
            isOwnProfile={isOwnProfile}
            editMode={actions.editMode}
            isUploading={actions.isUploadingAvatar}
            avatarInputRef={actions.avatarInputRef}
            onAvatarChange={actions.handleAvatarChange}
            onAvatarClick={() => {
              actions.avatarInputRef.current?.click();
              HapticFeedback.medium();
            }}
          />

          <div className="flex flex-1 items-center justify-between pb-2">
            <ProfileNameSection profile={profile} />

            {!isOwnProfile && (
              <div className="flex items-center gap-3">
                <FriendshipActions
                  friendshipStatus={friendshipStatus}
                  isActioning={actions.isActioning}
                  onSendRequest={actions.handleSendRequest}
                  onAcceptRequest={actions.handleAcceptRequest}
                  onRemoveFriend={actions.handleRemoveFriend}
                  onMessage={actions.handleMessage}
                />
              </div>
            )}

            {isOwnProfile && actions.editMode && (
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <div className="space-y-6 md:col-span-2">
            <ProfileAbout
              bio={profile.bio ?? undefined}
              isOwnProfile={isOwnProfile}
              editMode={actions.editMode}
              editedBio={actions.editedBio}
              onBioChange={actions.setEditedBio}
            />

            {isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <LevelProgress variant="expanded" showStreak={true} />
              </motion.div>
            )}

            {isOwnProfile && (
              <EquippedBadgesShowcase
                equippedBadges={equippedBadges}
                achievements={achievements}
                editMode={actions.editMode}
              />
            )}

            {isOwnProfile && (
              <AchievementsShowcase
                achievements={unlockedAchievements}
                totalUnlocked={totalUnlocked}
                totalAchievements={ACHIEVEMENT_DEFINITIONS.length}
                showAll={showAllAchievements}
                onToggleShowAll={() => setShowAllAchievements(!showAllAchievements)}
              />
            )}

            <ProfileStatsGrid profile={profile} />

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

          <ProfileSidebar profile={profile} />
        </motion.div>
      </div>
    </div>
  );
}
