/**
 * Unified Store Exports
 *
 * This is the single entry point for all Zustand stores.
 * Import from here for consistent access to application state.
 *
 * Stores are migrating to module-based organization.
 * This file maintains backward compatibility by re-exporting from modules.
 *
 * @example
 * ```typescript
 * // RECOMMENDED: Use facades for aggregated state
 * import { useChatFacade, useAuthFacade } from '@/stores';
 *
 * // Also works: Direct store imports (backward compatible)
 * import { useAuthStore, useChatStore } from '@/stores';
 * ```
 *
 * @module stores
 * @version 2.0.0
 */

// ============================================================================
// User Domain (Auth, Profile, Settings, Friends)
// ============================================================================
export { useAuthStore } from './authStore';
export type { User, AuthState } from './authStore';

export { useProfileStore } from './profileStore';

export { useSettingsStore } from '../modules/settings/store';
export type { UserSettings } from './settingsStore';

export { useFriendStore } from '../modules/social/store';
export type { Friend, FriendRequest } from './friendStore';

// ============================================================================
// Chat Domain (Messages, Conversations, Effects)
// Re-exported from modules/chat/store
// ============================================================================
export {
  useChatStore,
  useChatEffectsStore,
  useChatBubbleStore,
  type Message,
  type MessageMetadata,
  type Conversation,
  type ConversationParticipant,
  type Reaction,
  type ChatState,
} from '../modules/chat/store';

export { useIncomingCallStore } from './incomingCallStore';
export type { IncomingCall } from './incomingCallStore';

// ============================================================================
// Community Domain (Forums, Groups, Moderation)
// Re-exported from modules
// ============================================================================
export { useForumStore, useForumHostingStore, useAnnouncementStore } from '../modules/forums/store';

export { useGroupStore } from '../modules/groups/store';
export type { Group, Channel, Member, Role, ChannelMessage, ChannelCategory } from './groupStore';

export { useModerationStore } from '../modules/moderation/store';

// ============================================================================
// Gamification Domain (XP, Achievements, Events)
// Re-exported from modules/gamification/store
// ============================================================================
export {
  useGamificationStore,
  usePrestigeStore,
  useSeasonalEventStore,
  useReferralStore,
  useMarketplaceStore,
} from '../modules/gamification/store';

// ============================================================================
// Theme Domain (All Theme/Customization)
// ============================================================================
export { useThemeStore, THEME_COLORS } from './themeStore';
export { useProfileThemeStore } from './profileThemeStore';
export { useForumThemeStore } from './forumThemeStore';
export { useCustomizationStore } from './unifiedCustomizationStore';

// ============================================================================
// Marketplace Domain (Economy, Items)
// ============================================================================
export { useAvatarBorderStore } from './avatarBorderStore';

// ============================================================================
// Utility Domain (Notifications, Search, Misc)
// Re-exported from modules where available
// ============================================================================
export { useNotificationStore } from '../modules/social/store';
export { useSearchStore } from '../modules/search/store';
export { usePluginStore } from './pluginStore';
export { useCalendarStore } from './calendarStore';

// ============================================================================
// Utilities and Middleware
// ============================================================================
// Middleware utilities are available but not re-exported (internal use)
// export * from './middleware';
export * from './utils/storeHelpers';

// ============================================================================
// Domain Facades (Recommended for new code)
// ============================================================================
// Facades aggregate related stores into unified interfaces (29 stores → 7 domains)
export {
  useAuthFacade,
  useChatFacade,
  useCommunityFacade,
  useGamificationFacade,
  useSettingsFacade,
  useMarketplaceFacade,
  useUIFacade,
} from './facades';

export type {
  AuthFacade,
  ChatFacade,
  CommunityFacade,
  GamificationFacade,
  SettingsFacade,
  MarketplaceFacade,
  UIFacade,
} from './facades';
