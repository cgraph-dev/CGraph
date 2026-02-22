/**
 * Admin Dashboard Panels - Re-export from modular structure
 *
 * This file has been modularized. Panel components are now in separate files.
 * See individual files for implementation details.
 *
 * @module modules/admin/components/admin-dashboard/panels
 */

// Panel components
export { DashboardOverview } from './dashboard-overview';
export { EventsManagement } from './events-management';
export { MarketplaceModeration } from './marketplace-moderation';
export { UsersManagement } from './users-management';
export { AnalyticsDashboard } from './analytics-dashboard';
export { SystemSettings } from './system-settings';

// Shared components (for extensibility)
export {
  StatCard,
  QuickActionButton,
  ModerationQueueItem,
  ChartPlaceholder,
  MetricCard,
  ToggleSwitch,
  SettingsSection,
  SettingRow,
} from './shared-components';
