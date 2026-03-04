/**
 * Named layoutId constants for Framer Motion shared layout animations.
 *
 * Use these strings as `layoutId` props so that components animating the same
 * logical element share a consistent key, even across different components.
 *
 * @module animation-constants/layout-ids
 */
export const LAYOUT_IDS = {
  /** Active nav indicator pill in sidebar */
  sidebarActiveIndicator: 'sidebar-active-indicator',
  /** Active tab underline/pill in tab bars */
  tabActiveIndicator: 'tab-active-indicator',
  /** Notification badge position */
  notificationBadge: 'notification-badge',
  /** Chat input focus ring */
  chatInputFocus: 'chat-input-focus',
  /** Breadcrumb active segment */
  breadcrumbActive: 'breadcrumb-active',
} as const;
