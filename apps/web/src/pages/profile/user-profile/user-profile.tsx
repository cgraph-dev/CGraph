/**
 * UserProfile - Main profile page component
 *
 * Displays user profile information including:
 * - Banner and avatar with edit capabilities
 * - User info with verification badges and title
 * - Bio section
 * - XP progress and achievements
 * - Stats grid and sidebar
 * - Activity summary
 */

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  PaintBrushIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

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

import { ProfileBanner } from './profile-banner';
import { ProfileAvatar } from './profile-avatar';
import { ProfileNameSection } from './profile-name-section';
import { FriendshipActions } from './friendship-actions';
import { ProfileAbout } from './profile-about';
import { useProfileData } from './hooks/useProfileData';
import { useProfileActions } from './hooks/useProfileActions';
import { tweens } from '@/lib/animation-presets';

/** Stable empty array for stub achievements */
const EMPTY_ACHIEVEMENTS: never[] = [];

/** XP progress bar toward next level */
function XPProgressBar({
  currentXP,
  level,
}: {
  currentXP: number;
  totalXP: number;
  level: number;
}) {
  const xpForNextLevel = level * 500;
  const xpInCurrentLevel = currentXP % xpForNextLevel || 0;
  const progress =
    xpForNextLevel > 0 ? Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100) : 0;

  return (
    <GlassCard variant="frosted" className="p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Level {level} &rarr; {level + 1}
        </span>
        <span className="text-gray-500">
          {xpInCurrentLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </GlassCard>
  );
}

/** Activity summary cards showing messages sent, posts created, etc. */
function ActivitySummary({
  messagesSent,
  postsCreated,
}: {
  messagesSent?: number;
  postsCreated?: number;
}) {
  if (!messagesSent && !postsCreated) return null;

  return (
    <GlassCard variant="frosted" className="p-6">
      <h2 className="mb-4 flex items-center gap-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-lg font-semibold text-transparent">
        <TrophyIcon className="h-5 w-5 text-primary-400" />
        Activity
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.04] p-3">
          <ChatBubbleLeftIcon className="h-8 w-8 text-blue-400" />
          <div>
            <div className="text-xl font-bold text-white">
              {(messagesSent ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Messages Sent</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.04] p-3">
          <DocumentTextIcon className="h-8 w-8 text-green-400" />
          <div>
            <div className="text-xl font-bold text-white">
              {(postsCreated ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Forum Posts</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * User Profile component.
 */
export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const equippedBadges = useCustomizationStore((s) => s.equippedBadges) ?? [];

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
          transition={{ ...tweens.smooth, delay: 0.2 }}
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
            <div>
              <ProfileNameSection profile={profile} />
              {profile.statusMessage && (
                <p className="mt-1 text-sm italic text-gray-400">
                  &ldquo;{profile.statusMessage}&rdquo;
                </p>
              )}
            </div>

            {!isOwnProfile && (
              <div className="flex items-center gap-3">
                <FriendshipActions
                  friendshipStatus={friendshipStatus}
                  isActioning={actions.isActioning}
                  onSendRequest={actions.handleSendRequest}
                  onAcceptRequest={actions.handleAcceptRequest}
                  onDeclineRequest={actions.handleDeclineRequest}
                  onCancelRequest={actions.handleCancelRequest}
                  onRemoveFriend={actions.handleRemoveFriend}
                  onBlockUser={actions.handleBlockUser}
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
          transition={{ ...tweens.smooth, delay: 0.4 }}
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

            <XPProgressBar
              currentXP={profile.currentXP ?? profile.totalXP ?? 0}
              totalXP={profile.totalXP ?? 0}
              level={profile.level ?? 1}
            />

            <EquippedBadgesShowcase
              equippedBadges={equippedBadges}
              achievements={EMPTY_ACHIEVEMENTS}
              editMode={isOwnProfile && actions.editMode}
            />

            <AchievementsShowcase
              achievements={unlockedAchievements}
              totalUnlocked={totalUnlocked}
              totalAchievements={profile?.totalAchievements || 0}
              showAll={showAllAchievements}
              onToggleShowAll={() => setShowAllAchievements(!showAllAchievements)}
            />

            <ProfileStatsGrid profile={profile} />

            <ActivitySummary
              messagesSent={profile.messagesSent}
              postsCreated={profile.postsCreated}
            />

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
