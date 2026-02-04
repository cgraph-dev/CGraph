/**
 * Admin Module Types
 *
 * Type definitions for the admin module.
 * Re-exports types from store for convenience.
 *
 * @module modules/admin/types
 * @version 1.0.0
 */

// Re-export all types from store
export type {
  AdminTab,
  RiskLevel,
  ModerationItemType,
  ModerationStatus,
  EventStatus,
  UserStatus,
  AdminStats,
  ModerationItem,
  AdminEvent,
  EventReward,
  AdminUser,
  SystemSetting,
  AdminState,
  AdminActions,
  AdminStore,
} from '../store';

// Additional types for admin components

/**
 * Admin navigation item
 */
export interface AdminNavItem {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  badge?: number | string;
}

/**
 * Admin action button props
 */
export interface AdminActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Admin table column definition
 */
export interface AdminTableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string | number;
  render?: (item: T) => React.ReactNode;
}

/**
 * Admin pagination state
 */
export interface AdminPaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Admin filter option
 */
export interface AdminFilterOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * Admin analytics data point
 */
export interface AdminAnalyticsDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Admin chart config
 */
export interface AdminChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: AdminAnalyticsDataPoint[];
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

/**
 * Admin audit log entry
 */
export interface AdminAuditLogEntry {
  id: string;
  action: string;
  actor: {
    id: string;
    username: string;
    role: string;
  };
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  details: Record<string, unknown>;
  ip: string;
  timestamp: Date;
}

/**
 * Admin notification
 */
export interface AdminNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

/**
 * Admin dashboard widget
 */
export interface AdminDashboardWidget {
  id: string;
  type: 'stat' | 'chart' | 'list' | 'activity';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

/**
 * Admin export options
 */
export interface AdminExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, unknown>;
  fields?: string[];
}

/**
 * Admin bulk action result
 */
export interface AdminBulkActionResult {
  success: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

/**
 * Admin permission
 */
export type AdminPermission =
  | 'admin.view'
  | 'admin.users.view'
  | 'admin.users.edit'
  | 'admin.users.ban'
  | 'admin.moderation.view'
  | 'admin.moderation.review'
  | 'admin.events.view'
  | 'admin.events.edit'
  | 'admin.events.create'
  | 'admin.analytics.view'
  | 'admin.settings.view'
  | 'admin.settings.edit';

/**
 * Check if user has required admin permission
 */
export function hasAdminPermission(
  userPermissions: AdminPermission[],
  required: AdminPermission | AdminPermission[]
): boolean {
  const requiredArray = Array.isArray(required) ? required : [required];
  return requiredArray.every((perm) => userPermissions.includes(perm));
}
