/**
 * Unified Store Exports
 *
 * Single entry point for all Zustand stores.
 * All stores route through canonical module paths.
 *
 * @example
 * ```typescript
 * import { useAuthStore, useChatStore } from '@/stores';
 * ```
 *
 * @module stores
 * @version 3.0.0
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
// ============================================================================
export { useForumStore, useForumHostingStore, useAnnouncementStore } from '../modules/forums/store';

export { useGroupStore } from '../modules/groups/store';
export type { Group, Channel, Member, Role, ChannelMessage, ChannelCategory } from './groupStore';

export { useModerationStore } from '../modules/moderation/store';

// ============================================================================
// Gamification Domain (XP, Achievements, Events)
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
// ============================================================================
export { useNotificationStore } from '../modules/social/store';
export { useSearchStore } from '../modules/search/store';
export { usePluginStore } from './pluginStore';
export { useCalendarStore } from './calendarStore';

// ============================================================================
// Utilities
// ============================================================================
export * from './utils/storeHelpers';
