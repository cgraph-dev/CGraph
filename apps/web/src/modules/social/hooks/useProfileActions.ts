/**
 * Hook for profile action operations.
 * @module
 */
import { useState, useCallback } from 'react';
import { useFriendStore } from '@/modules/social/store';
import type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

// Re-export submodule hooks
export { useProfileData } from './useProfileData';
export type { UseProfileDataReturn } from './useProfileData';
export { useProfileEdit } from './useProfileEdit';
export type { UseProfileEditReturn } from './useProfileEdit';

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
