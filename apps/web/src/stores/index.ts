/**
 * Unified Store Exports
 *
 * This is the single entry point for all Zustand stores.
 * Import from here for consistent access to application state.
 *
 * @example
 * ```typescript
 * // Preferred: Import from stores/index
 * import { useAuthStore, useChatStore, useThemeStore } from '@/stores';
 *
 * // Still works: Direct imports (backward compatible)
 * import { useAuthStore } from '@/stores/authStore';
 * ```
 *
 * @module stores
 * @version 1.0.0
 */

// ============================================================================
// User Domain (Auth, Profile, Settings, Friends)
// ============================================================================
export { useAuthStore } from './authStore';
export type { User, AuthState } from './authStore';

export { useProfileStore } from './profileStore';

export { useSettingsStore } from './settingsStore';
export type { UserSettings } from './settingsStore';

export { useFriendStore } from './friendStore';
export type { Friend, FriendRequest } from './friendStore';

// ============================================================================
// Chat Domain (Messages, Conversations, Effects)
// ============================================================================
export { useChatStore } from './chatStore';
export type {
  Message,
  MessageMetadata,
  Conversation,
  ConversationParticipant,
  Reaction,
  ChatState,
} from './chatStore';

export { useChatEffectsStore } from './chatEffectsStore';
export { useChatBubbleStore } from './chatBubbleStore';
export { useIncomingCallStore } from './incomingCallStore';
export type { IncomingCall } from './incomingCallStore';

// ============================================================================
// Community Domain (Forums, Groups, Moderation)
// ============================================================================
export { useForumStore } from './forumStore';
export { useGroupStore } from './groupStore';
export type { Group, Channel, Member, Role, ChannelMessage, ChannelCategory } from './groupStore';

export { useModerationStore } from './moderationStore';
export { useForumHostingStore } from './forumHostingStore';
export { useAnnouncementStore } from './announcementStore';

// ============================================================================
// Gamification Domain (XP, Achievements, Events)
// ============================================================================
export { useGamificationStore } from './gamificationStore';
export { usePrestigeStore } from './prestigeStore';
export { useSeasonalEventStore } from './seasonalEventStore';
export { useReferralStore } from './referralStore';

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
export { useMarketplaceStore } from './marketplaceStore';
export { useAvatarBorderStore } from './avatarBorderStore';

// ============================================================================
// Utility Domain (Notifications, Search, Misc)
// ============================================================================
export { useNotificationStore } from './notificationStore';
export { useSearchStore } from './searchStore';
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
