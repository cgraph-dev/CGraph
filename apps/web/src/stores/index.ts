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
 * @version 4.0.0
 */

// ============================================================================
// User Domain (Auth, Profile, Settings, Friends)
// ============================================================================
export { useAuthStore } from '../modules/auth/store';
export type { User, AuthState } from '../modules/auth/store';

export { useProfileStore } from '../modules/social/store';

export { useSettingsStore } from '../modules/settings/store';
export type { UserSettings } from '../modules/settings/store';

export { useFriendStore } from '../modules/social/store';
export type { Friend, FriendRequest } from '../modules/social/store';

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

export { useIncomingCallStore } from '../modules/calls/store';
export type { IncomingCall } from '../modules/calls/store';

// ============================================================================
// Community Domain (Forums, Groups, Moderation)
// ============================================================================
export { useForumStore, useForumHostingStore, useAnnouncementStore } from '../modules/forums/store';

export { useGroupStore } from '../modules/groups/store';
export type {
  Group,
  Channel,
  Member,
  Role,
  ChannelMessage,
  ChannelCategory,
} from '../modules/groups/store';

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
export { useThemeStore, THEME_COLORS } from './theme';
export type {
  ColorPreset as ThemeColorPreset,
  AvatarBorderType,
  ChatBubbleStylePreset,
  EffectPreset,
} from './theme/types';
export { useForumThemeStore } from './theme';
export { useCustomizationStore } from '../modules/settings/store/customization';

// ============================================================================
// Marketplace Domain (Economy, Items)
// ============================================================================
export { useAvatarBorderStore } from '../modules/gamification/store';

// ============================================================================
// Utility Domain (Notifications, Search, Misc)
// ============================================================================
export { useNotificationStore } from '../modules/social/store';
export { useSearchStore } from '../modules/search/store';
export { usePluginStore } from '../modules/settings/store';
export { useCalendarStore } from '../modules/settings/store';
