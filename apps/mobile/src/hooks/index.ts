/**
 * Mobile Hooks Index
 * 
 * Central export for all React Native hooks.
 */

// Core utility hooks
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useCopyToClipboard, useClipboardRead } from './useCopyToClipboard';
export { useAsyncStorage, useLocalStorage } from './useAsyncStorage';
export { useWindowSize, useScreenSize, useIsLandscape, useIsTablet } from './useWindowSize';
export { useHaptics, useHapticPress } from './useHaptics';
export type { HapticStyle } from './useHaptics';
export { useInterval, useTimeout, useIsMounted, usePrevious } from './useInterval';

// Feature-specific hooks
export { useGamification } from './useGamification';
export { useFriendPresence, useIsFriendOnline, useFriendsPresence } from './useFriendPresence';
export { useContactsPresence } from './useContactsPresence';
export { useNotifications } from './useNotifications';
export { useSearch } from './useSearch';
export { useGroups } from './useGroups';
export { usePremium } from './usePremium';
export { useCalendar } from './useCalendar';
export { usePushNotifications } from './usePushNotifications';
export { useSocket } from './useSocket';
export { 
  useRealtimeChannel, 
  useConversationChannel, 
  useGroupChannel, 
  useForumChannel,
  useThreadChannel
} from './useRealtimeChannel';
export { useReferrals } from './useReferrals';
export { useE2EE } from './useE2EE';
export { useOfflineQueue } from './useOfflineQueue';

// Feature module hooks (re-exports)
export * from '../features/messaging/hooks';
export * from '../features/gamification/hooks';
export * from '../features/premium/hooks';
export * from '../features/groups/hooks';
export * from '../features/auth/hooks';
