/**
 * Shared Types - Single Export Point
 *
 * Re-exports commonly used types from various sources.
 * Import from '@/shared/types' for module-based architecture.
 *
 * @module @shared/types
 */

// Re-export all types from the shared-types package
export type * from '@cgraph/shared-types';

// Profile types
export type { UserProfileData, FriendshipStatus } from '@/types/profile.types';

// Admin types
export type {
  AdminUser,
  SystemMetrics,
  Report,
  AuditEntry,
  TabId,
  StatItem,
  RealtimeStatsItem,
} from '@/types/admin.types';
