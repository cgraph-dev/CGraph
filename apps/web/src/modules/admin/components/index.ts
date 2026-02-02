/**
 * Admin Components Index
 *
 * Exports all admin-related components for the CGraph admin panel.
 */

// Dashboard
export { default as AdminDashboard } from './AdminDashboard';

// Forum Management
export {
  default as ForumOrderingAdmin,
  ForumOrderingAdmin as ForumOrderingAdminComponent,
  type ForumItem,
  type ForumOrderingAdminProps,
} from './ForumOrderingAdmin';
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
} from './AdminSharedComponents';
