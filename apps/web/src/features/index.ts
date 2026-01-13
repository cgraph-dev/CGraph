/**
 * CGraph Features - Domain-Driven Design Modules
 * 
 * This barrel export provides access to all feature modules following DDD principles.
 * Each feature is self-contained with its own components, hooks, stores, services, and types.
 * 
 * Usage:
 * ```typescript
 * // Import entire feature
 * import * as messaging from '@features/messaging';
 * 
 * // Import specific exports
 * import { useChatStore, MessageInput, messagingApi } from '@features/messaging';
 * 
 * // Import from specific submodule
 * import { SendMessagePayload } from '@features/messaging/types';
 * ```
 * 
 * @module @features
 * @since v0.8.3
 */

// Feature modules
export * as messaging from './messaging';
export * as forums from './forums';
export * as gamification from './gamification';
export * as premium from './premium';
export * as groups from './groups';
export * as auth from './auth';

// Re-export commonly used items at top level for convenience
export {
  // Messaging
  useChatStore,
  messagingApi,
} from './messaging';

export {
  // Forums
  useForumStore,
  forumApi,
  parseBBCode,
} from './forums';

export {
  // Gamification
  useGamificationStore,
  gamificationApi,
  XP_REWARDS,
  useXPTracker,
  useAchievements,
  useQuests,
} from './gamification';

export {
  // Premium
  usePremiumStore,
  premiumApi,
  TIER_FEATURES,
  usePremiumStatus,
  useCoins,
} from './premium';

export {
  // Groups
  useGroupStore,
  groupsApi,
  PERMISSIONS,
  hasPermission,
  usePermissions,
} from './groups';

export {
  // Auth
  useAuthStore,
  authApi,
  validatePassword,
  useAuth,
  useTwoFactor,
  useSessions,
} from './auth';
