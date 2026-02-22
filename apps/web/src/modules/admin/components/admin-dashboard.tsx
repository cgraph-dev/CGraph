/**
 * Admin Dashboard for Gamification System
 *
 * Comprehensive admin interface with:
 * - Event management (create, edit, lifecycle control)
 * - Marketplace moderation (flagged listings, disputes)
 * - Analytics dashboard
 * - User management
 * - System settings
 *
 * Design principles:
 * - Role-based access control visibility
 * - Real-time updates via WebSocket
 * - Keyboard shortcuts for power users
 * - Responsive mobile-first design
 * - Dark mode optimized
 *
 * @module admin-dashboard
 */

// Re-export from modular structure
export {
  AdminDashboard,
  default,
  // Types
  type AdminTab,
  type AdminStats,
  type ModerationItem,
  type EventData,
  type StatCardProps,
  type NavItem,
  type CreateEventModalProps,
  // Constants
  NAV_ITEMS,
  RISK_COLORS,
  STATUS_COLORS,
  EVENT_FILTERS,
  // Panels
  DashboardOverview,
  EventsManagement,
  MarketplaceModeration,
  UsersManagement,
  AnalyticsDashboard,
  SystemSettings,
} from './admin-dashboard/index';
