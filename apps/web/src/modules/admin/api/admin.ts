/**
 * Admin API Client
 *
 * Barrel re-export that composes the unified adminApi object
 * from domain-specific submodules.
 */

// Re-export all public types
export type {
  SystemMetrics,
  RealtimeStats,
  AdminUser,
  UsersListResponse,
  Report,
  ReportsListResponse,
  AuditEntry,
  AuditLogResponse,
  SystemConfig,
} from './types';

// Import submodule APIs
import { metricsApi } from './metricsApi';
import { userManagementApi } from './userManagementApi';
import { moderationApi } from './moderationApi';
import { auditApi } from './auditApi';
import { systemApi } from './systemApi';
import { eventsApi } from './eventsApi';
import { marketplaceApi } from './marketplaceApi';

// Re-export submodule APIs for direct imports
export { eventsApi } from './eventsApi';
export { marketplaceApi } from './marketplaceApi';
export { metricsApi } from './metricsApi';
export { userManagementApi } from './userManagementApi';
export { moderationApi } from './moderationApi';

// ============================================================================
// Composed Admin API (preserves original unified interface)
// ============================================================================

export const adminApi = {
  // Metrics & health
  ...metricsApi,
  // User management
  ...userManagementApi,
  // Moderation / reports
  ...moderationApi,
  // Audit log
  ...auditApi,
  // System config, jobs & announcements
  ...systemApi,
  // Events management
  ...eventsApi,
  // Marketplace moderation
  ...marketplaceApi,
};

export default adminApi;
