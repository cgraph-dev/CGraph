/**
 * Auth Facade
 *
 * Unified interface for authentication and user identity.
 * Aggregates: authStore, profileStore, friendStore
 *
 * @module stores/facades/authFacade
 */

import { useAuthStore } from '../authStore';
import { useProfileStore } from '../profileStore';
import { useFriendStore } from '../friendStore';

/**
 * Unified authentication and user facade
 * Provides a single hook for all auth-related state and actions
 */
export function useAuthFacade() {
  const auth = useAuthStore();
  const profile = useProfileStore();
  const friends = useFriendStore();

  return {
    // === Auth State ===
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    token: auth.token,
    error: auth.error,

    // === Auth Actions ===
    login: auth.login,
    logout: auth.logout,
    register: auth.register,
    refreshToken: auth.refreshToken,
    updateUser: auth.updateUser,
    clearError: auth.clearError,

    // === Profile State ===
    myProfile: profile.myProfile,
    profileLoading: profile.isLoadingProfile,
    profileError: profile.profileError,
    mySignature: profile.mySignature,

    // === Profile Actions ===
    fetchProfile: profile.fetchProfile,
    fetchMyProfile: profile.fetchMyProfile,
    updateProfile: profile.updateProfile,
    uploadAvatar: profile.uploadAvatar,
    uploadBanner: profile.uploadBanner,

    // === Friends State ===
    friends: friends.friends,
    pendingRequests: friends.pendingRequests,
    sentRequests: friends.sentRequests,
    friendsLoading: friends.isLoading,

    // === Friends Actions ===
    fetchFriends: friends.fetchFriends,
    fetchPendingRequests: friends.fetchPendingRequests,
    sendRequest: friends.sendRequest,
    acceptRequest: friends.acceptRequest,
    declineRequest: friends.declineRequest,
    removeFriend: friends.removeFriend,
    blockUser: friends.blockUser,
    unblockUser: friends.unblockUser,

    // === Direct Store Access (for edge cases) ===
    _stores: { auth, profile, friends },
  };
}

export type AuthFacade = ReturnType<typeof useAuthFacade>;
