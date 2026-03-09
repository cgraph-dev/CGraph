/**
 * Domain Facade Hooks
 *
 * Composition hooks that aggregate multiple Zustand stores
 * into stable, domain-specific interfaces. Each facade provides a single
 * entry point for a feature domain, preventing store coupling in components.
 *
 * ## Architecture
 *
 * ```
 * Component → useFacade() → [StoreA, StoreB, StoreC]
 * ```
 *
 * Instead of:
 * ```
 * Component → useStoreA() + useStoreB() + useStoreC()
 * ```
 *
 * ## Benefits
 * - **Decoupled components**: Components depend on domain interfaces, not store internals
 * - **Stable references**: useMemo prevents unnecessary re-renders
 * - **Primitive selectors**: Each store subscription uses individual fields (selector pattern)
 * - **Testable**: Facades can be mocked as a single object in tests
 *
 * ## Available Facades
 *
 * | Facade | Stores Composed |
 * |--------|----------------|
 * | `useAuthFacade` | authStore |
 * | `useChatFacade` | chatStore, chatEffectsStore, chatBubbleStore |
 * | `useCommunityFacade` | forumStore, groupStore, announcementStore, moderationStore |
 * | `useSettingsFacade` | settingsStore, customizationStore, themeStore |
 * | `useUIFacade` | notificationStore, searchStore, calendarStore |
 *
 * @module hooks/facades
 */

export { useAuthFacade, type AuthFacade } from './useAuthFacade';
export { useChatFacade, type ChatFacade } from './useChatFacade';
export { useCommunityFacade, type CommunityFacade } from './useCommunityFacade';
export { useSettingsFacade, type SettingsFacade } from './useSettingsFacade';
export { useUIFacade, type UIFacade } from './useUIFacade';
