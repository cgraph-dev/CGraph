/**
 * Hook for profile data fetching.
 * @module
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

const logger = createLogger('useProfileActions');

// ============================================================================
// Profile Data Loading Hook
// ============================================================================

export interface UseProfileDataReturn {
  profile: UserProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
  isLoading: boolean;
  error: string | null;
  friendshipStatus: FriendshipStatus;
  setFriendshipStatus: React.Dispatch<React.SetStateAction<FriendshipStatus>>;
  refreshProfile: () => Promise<void>;
}

/**
 * unknown for the social module.
 */
/**
 * Hook for managing profile data.
 *
 * @param userId - The user id.
 * @param isOwnProfile - The is own profile.
 * @param ownStats - The own stats.
 */
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
        totalAchievements: userData.total_achievements || 0,
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
