/**
 * Social Hub Module
 * Barrel export for all social components
 */

// Types
export type * from './types';

// Utils
export * from './utils';

// Components
export { FriendsTab } from './friends-tab';
export { NotificationsTab } from './notifications-tab';
export { DiscoverTab } from './discover-tab';
export { Social } from './social';

// Default export for page routing
export { Social as default } from './social';
