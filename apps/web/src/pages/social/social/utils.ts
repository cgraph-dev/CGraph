/**
 * Social Hub - Utility Functions
 */

// =============================================================================
// NOTIFICATION HELPERS
// =============================================================================

export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'friend_request':
      return '👥';
    case 'message':
      return '💬';
    case 'forum_reply':
      return '📝';
    case 'achievement':
      return '🏆';
    case 'mention':
      return '📢';
    default:
      return '🔔';
  }
}

// =============================================================================
// SEARCH HELPERS
// =============================================================================

export function getSearchResultIcon(type: string): string {
  switch (type) {
    case 'user':
      return '👤';
    case 'forum':
      return '📰';
    case 'group':
      return '👥';
    default:
      return '🔍';
  }
}

// =============================================================================
// TIME FORMATTING
// =============================================================================

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
