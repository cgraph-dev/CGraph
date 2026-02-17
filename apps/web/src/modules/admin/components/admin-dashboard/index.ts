/**
 * Admin Dashboard Module
 * Barrel exports for the admin dashboard component
 */

export { AdminDashboard, default } from './page';
export type {
  AdminTab,
  AdminStats,
  ModerationItem,
  EventData,
  StatCardProps,
  NavItem,
  CreateEventModalProps,
} from './types';
export { NAV_ITEMS, RISK_COLORS, STATUS_COLORS, EVENT_FILTERS } from './constants';
export {
  DashboardOverview,
  EventsManagement,
  MarketplaceModeration,
  UsersManagement,
  AnalyticsDashboard,
  SystemSettings,
} from './panels';
