/**
 * OnlineStatusIndicator — split into online-status/ subdirectory
 * Re-exports all components for backward compatibility.
 */
export {
  OnlineStatusIndicator,
  OnlineStatusBadge,
  OnlineStatusDropdown,
  default,
} from './online-status';
export type { OnlineStatus } from './online-status';
export {
  statusConfig,
  statusHexColors,
  glowColors,
  formatLastActive,
  formatLastActiveLong,
} from './online-status';

