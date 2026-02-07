/**
 * Groups Module
 *
 * Group management functionality including:
 * - Components (group list, channel views, member management)
 * - Store (group state, channels, members, messages)
 * - Hooks (useGroups, useActiveGroup, useGroupMembers, etc.)
 */

export * from './components';
export * from './store';
export * from './hooks';
// Types not re-exported: name collision with components (GroupSettings)
// Import directly from '@/modules/groups/types' when needed
