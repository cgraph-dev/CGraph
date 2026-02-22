/**
 * Notifications Module
 *
 * Barrel exports for the modular notifications page.
 */

// Main component
export { default, Notifications } from './notifications';

// Sub-components
export { AmbientParticles } from './ambient-particles';
export { NotificationHeader } from './notification-header';
export { NotificationFilterTabs } from './notification-filter-tabs';
export { NotificationItem } from './notification-item';
export { EmptyState } from './empty-state';
export { LoadMoreButton } from './load-more-button';

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
