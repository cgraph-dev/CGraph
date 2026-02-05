/**
 * Custom hook for fetching and managing profile data
 */

import { useState, useEffect, useMemo } from 'react';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import { useGamificationStore } from '@/stores/gamificationStore';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

const logger = createLogger('useProfileData');

interface UseProfileDataOptions {
  userId: string | undefined;
  isOwnProfile: boolean;
}

interface UseProfileDataReturn {
  profile: UserProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  isLoading: boolean;
  error: string | null;
  friendshipStatus: FriendshipStatus;
  setFriendshipStatus: React.Dispatch<React.SetStateAction<FriendshipStatus>>;
  unlockedAchievements: typeof achievements;
  totalUnlocked: number;
  showAllAchievements: boolean;
  setShowAllAchievements: React.Dispatch<React.SetStateAction<boolean>>;
}

// Get achievements from store for type
const { achievements } = useGamificationStore.getState();

export function useProfileData({
  userId,
  isOwnProfile,
}: UseProfileDataOptions): UseProfileDataReturn {
  const {
    achievements,
    level: myLevel,
    totalXP: myTotalXP,
    loginStreak: myStreak,
  } = useGamificationStore();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // Calculate total unlocked achievements
  const totalUnlocked = useMemo(
    () => achievements.filter((a) => a.unlocked).length,
    [achievements]
  );

  // Calculate unlocked achievements for display
  const unlockedAchievements = useMemo(() => {
    if (!isOwnProfile) return [];
    return achievements.filter((a) => a.unlocked).slice(0, showAllAchievements ? undefined : 6);
  }, [achievements, isOwnProfile, showAllAchievements]);

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
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
          level: userData.level || (isOwnProfile ? myLevel : 1),
          totalXP: userData.total_xp || (isOwnProfile ? myTotalXP : 0),
          currentXP: userData.current_xp || 0,
          loginStreak: userData.login_streak || (isOwnProfile ? myStreak : 0),
          achievementCount: userData.achievement_count || (isOwnProfile ? totalUnlocked : 0),
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
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
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
  };
}
