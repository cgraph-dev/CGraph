/**
 * Admin Dashboard Panels - Re-export from modular structure
 *
 * This file has been modularized. Panel components are now in separate files.
 * See individual files for implementation details.
 *
 * @module modules/admin/components/admin-dashboard/panels
 */

// Panel components
export { DashboardOverview } from './DashboardOverview';
export { EventsManagement } from './EventsManagement';
export { MarketplaceModeration } from './MarketplaceModeration';
export { UsersManagement } from './UsersManagement';
export { AnalyticsDashboard } from './AnalyticsDashboard';
export { SystemSettings } from './SystemSettings';

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
