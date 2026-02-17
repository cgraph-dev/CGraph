/**
 * Social Hub Module
 * Barrel export for all social components
 */

// Types
export type * from './types';

// Utils
export * from './utils';

// Components
export { FriendsTab } from './FriendsTab';
export { NotificationsTab } from './NotificationsTab';
export { DiscoverTab } from './DiscoverTab';
export { Social } from './Social';

// Default export for page routing
export { Social as default } from './Social';
