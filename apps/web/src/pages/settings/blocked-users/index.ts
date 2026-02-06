/**
 * Blocked Users Module
 *
 * User blocking management page with search, unblock confirmation,
 * and animated card list. Supports real-time block/unblock operations.
 *
 * @module pages/settings/blocked-users
 */

// Main component
export { default } from './BlockedUsers';

// Sub-components
export { BlockedUserCard } from './BlockedUserCard';
export { ConfirmUnblockModal } from './ConfirmUnblockModal';
export { EmptyState } from './EmptyState';
export { SearchBar } from './SearchBar';

// Hooks
export { useBlockedUsers } from './hooks';

// Types
export type { BlockedUser } from './types';

// Animations
export { containerVariants, itemVariants } from './animations';
