/**
 * Notifications Module
 *
 * Barrel exports for the modular notifications page.
 */

// Main component
export { default, Notifications } from './Notifications';

// Sub-components
export { AmbientParticles } from './AmbientParticles';
export { NotificationHeader } from './NotificationHeader';
export { NotificationFilterTabs } from './NotificationFilterTabs';
export { NotificationItem } from './NotificationItem';
export { EmptyState } from './EmptyState';
export { LoadMoreButton } from './LoadMoreButton';

// Types
export type {
  NotificationFilter,
  NotificationItemProps,
  NotificationHeaderProps,
  NotificationFilterTabsProps,
  NotificationListProps,
  LoadMoreButtonProps,
  EmptyStateProps,
  Notification,
} from './types';

// Constants
export { TYPE_ICONS, TYPE_COLORS, DEFAULT_ICON, DEFAULT_COLOR } from './constants';
