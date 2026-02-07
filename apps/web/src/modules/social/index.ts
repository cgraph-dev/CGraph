/**
 * Social Module
 */

export * from './components';
export * from './store';
export * from './hooks';
// Types not re-exported: name collisions with store types (Friend, Notification)
// Import directly from '@/modules/social/types' when needed
