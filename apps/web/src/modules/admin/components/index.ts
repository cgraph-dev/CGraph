/**
 * Admin Module Components
 *
 * Re-exports admin components from centralized location.
 * Import from '@/modules/admin/components' for module-based organization.
 *
 * @module @modules/admin/components
 */

// Re-export all admin components from legacy location
export {
  AdminDashboard,
  ForumOrderingAdmin,
  ForumOrderingAdminComponent,
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
} from '@/components/admin';

// Re-export types
export type { ForumItem, ForumOrderingAdminProps } from '@/components/admin';
