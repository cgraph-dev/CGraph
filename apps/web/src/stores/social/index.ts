/**
 * Social Module
 *
 * Unified social features combining:
 * - Friends management (friendSlice)
 * - Notifications (notificationSlice)
 * - User profiles (profileSlice)
 *
 * This module provides a single entry point for all social features
 * while maintaining backward compatibility with existing imports.
 */

// Re-export friend slice
export { useFriendStore, type Friend, type FriendRequest } from './friendSlice';

// Re-export notification slice
export { useNotificationStore, type Notification } from './notificationSlice';

// Re-export profile slice
export {
  useProfileStore,
  type ExtendedProfile,
  type ProfileField,
  type UpdatePrivacySettings,
  type UserSignature,
  type UserBadge,
  type UserTitle,
  type BlockedUser,
} from './profileSlice';

// Unified social state type
export interface SocialData {
  // Friends
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Profile
  currentProfile: ExtendedProfile | null;
  myProfile: ExtendedProfile | null;
}

// Import types for the unified interface
import type { Friend, FriendRequest } from './friendSlice';
import type { Notification } from './notificationSlice';
import type { ExtendedProfile } from './profileSlice';

// Combined selectors for common use cases
export const useSocialUnreadCount = () => {
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  const pendingFriendRequests = useFriendStore((state) => state.pendingRequests.length);
  return unreadNotifications + pendingFriendRequests;
};

// Re-import stores for selector
import { useNotificationStore } from './notificationSlice';
import { useFriendStore } from './friendSlice';
