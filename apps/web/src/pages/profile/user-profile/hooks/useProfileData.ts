/**
 * Custom hook for fetching and managing profile data
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import type { Achievement } from '@cgraph/shared-types';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

const logger = createLogger('useProfileData');

/** Stable empty array for stub achievements (avoids new reference each render) */
const EMPTY_ACHIEVEMENTS: Achievement[] = [];

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
  unlockedAchievements: Achievement[];
  totalUnlocked: number;
  showAllAchievements: boolean;
  setShowAllAchievements: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * unknown for the profile module.
 */
/**
 * Hook for managing profile data.
 */
export function useProfileData({
  userId,
  isOwnProfile,
}: UseProfileDataOptions): UseProfileDataReturn {
  // TODO(phase-26): Rewire — gamification stores deleted
  const achievements = EMPTY_ACHIEVEMENTS;
  const myLevel = 1;
  const myTotalXP = 0;
  const myStreak = 0;

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

  // Refs for gamification values used as fallbacks in fetch (not as triggers)
  const myLevelRef = useRef(myLevel);
  const myTotalXPRef = useRef(myTotalXP);
  const myStreakRef = useRef(myStreak);
  const totalUnlockedRef = useRef(totalUnlocked);

  useEffect(() => {
    myLevelRef.current = myLevel;
    myTotalXPRef.current = myTotalXP;
    myStreakRef.current = myStreak;
    totalUnlockedRef.current = totalUnlocked;
  }, [myLevel, myTotalXP, myStreak, totalUnlocked]);

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(`/api/v1/users/${userId}`);
        // Backend wraps in { data: { ... } }, axios also puts body in .data
        const userData = response.data?.data || response.data?.user || response.data;

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
          level: userData.level || (isOwnProfile ? myLevelRef.current : 1),
          totalXP: userData.total_xp || userData.xp || (isOwnProfile ? myTotalXPRef.current : 0),
          currentXP: userData.current_xp || 0,
          loginStreak:
            userData.login_streak ||
            userData.streak_days ||
            (isOwnProfile ? myStreakRef.current : 0),
          achievementCount:
            userData.achievement_count || (isOwnProfile ? totalUnlockedRef.current : 0),
          totalAchievements: userData.total_achievements || achievements.length,
          messagesSent: userData.messages_sent || 0,
          postsCreated: userData.posts_created || 0,
          friendsCount: userData.friends_count || 0,
          // Title system - equipped title ID
          equippedTitle:
            userData.equipped_title || userData.equipped_title_id || userData.title_id || null,
        });

        // Backend returns is_friend/friend_request_sent/friend_request_received booleans
        // Derive friendship status string from them
        const derivedStatus: FriendshipStatus = userData.friendship_status
          ? userData.friendship_status
          : userData.is_friend
            ? 'friends'
            : userData.friend_request_received
              ? 'pending_received'
              : userData.friend_request_sent
                ? 'pending_sent'
                : 'none';
        setFriendshipStatus(derivedStatus);
      } catch (err) {
        logger.error('Failed to load profile:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [userId, isOwnProfile, achievements.length]);

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
