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
