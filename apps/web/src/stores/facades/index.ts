/**
 * Store Facades
 *
 * Unified domain-based facades that aggregate related stores
 * into cohesive interfaces. This reduces the 29+ stores into
 * 7 logical domains while maintaining backward compatibility.
 *
 * Domains:
 * 1. auth     - Authentication, user session, profile
 * 2. chat     - Messages, conversations, calls, effects
 * 3. community - Forums, groups, moderation, announcements
 * 4. gamification - XP, achievements, prestige, events
 * 5. settings - User preferences, theme, customization
 * 6. marketplace - Economy, items, borders
 * 7. ui       - Notifications, search, calendar, plugins
 *
 * @module stores/facades
 */

export { useAuthFacade, type AuthFacade } from './authFacade';
export { useChatFacade, type ChatFacade } from './chatFacade';
export { useCommunityFacade, type CommunityFacade } from './communityFacade';
export { useGamificationFacade, type GamificationFacade } from './gamificationFacade';
export { useSettingsFacade, type SettingsFacade } from './settingsFacade';
export { useMarketplaceFacade, type MarketplaceFacade } from './marketplaceFacade';
export { useUIFacade, type UIFacade } from './uiFacade';
