/**
 * Blocked Users Module
 *
 * User blocking management page with search, unblock confirmation,
 * and animated card list. Supports real-time block/unblock operations.
 *
 * @module pages/settings/blocked-users
 */

// Main component
export { default } from './blocked-users';

// Sub-components
export { BlockedUserCard } from './blocked-user-card';
export { ConfirmUnblockModal } from './confirm-unblock-modal';
export { EmptyState } from './empty-state';
export { SearchBar } from './search-bar';

// Hooks
export { useBlockedUsers } from './hooks';

// Types
export type { BlockedUser } from './types';

// Animations
export { containerVariants, itemVariants } from './animations';
