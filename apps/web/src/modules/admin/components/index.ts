/**
 * Admin Components Index
 *
 * Exports all admin-related components for the CGraph admin panel.
 */

// Dashboard
export { default as AdminDashboard } from './admin-dashboard';

// Forum Management
export {
  default as ForumOrderingAdmin,
  ForumOrderingAdmin as ForumOrderingAdminComponent,
  type ForumItem,
  type ForumOrderingAdminProps,
} from './forum-ordering-admin';
// Shared UI components
export {
  StatusBadge,
  LoadingState,
  EmptyState,
  ProgressBar,
  MetricCard,
  RealtimeStat,
  StatsCard,
  SystemHealthCard,
  JobsStatusCard,
  SettingToggle,
  SettingNumber,
  formatUptime,
  ChatBubbleIcon,
} from './admin-shared-components';
