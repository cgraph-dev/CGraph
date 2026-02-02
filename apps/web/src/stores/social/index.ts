/**
 * Social Module
 *
 * Unified social features combining:
 * - Friends management (friendStore)
 * - Notifications (notificationSlice)
 * - User profiles (profileStore)
 *
 * This module provides a single entry point for all social features
 * while maintaining backward compatibility with existing imports.
 */

// Re-export friend store from root
export { useFriendStore, type Friend, type FriendRequest } from '@/stores/friendStore';

// Re-export notification slice
export { useNotificationStore, type Notification } from './notificationSlice';

// Re-export profile store from root
export {
  useProfileStore,
  type ExtendedProfile,
  type ProfileField,
  type UpdatePrivacySettings,
  type UserSignature,
  type UserBadge,
  type UserTitle,
  type BlockedUser,
} from '@/stores/profileStore';

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
import type { Friend, FriendRequest } from '@/stores/friendStore';
import type { Notification } from './notificationSlice';
import type { ExtendedProfile } from '@/stores/profileStore';

// Combined selectors for common use cases
export const useSocialUnreadCount = () => {
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  const pendingFriendRequests = useFriendStore((state) => state.pendingRequests.length);
  return unreadNotifications + pendingFriendRequests;
};

// Re-import stores for selector
import { useNotificationStore } from './notificationSlice';
import { useFriendStore } from '@/stores/friendStore';
