/**
 * Type definitions and constants for online status indicators.
 * @module modules/social/components/common/online-status/types
 */
export type OnlineStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';

/** Hex color map for animated backgroundColor transitions */
export const statusHexColors: Record<OnlineStatus, string> = {
  online: '#22c55e',
  idle: '#eab308',
  dnd: '#ef4444',
  offline: '#9ca3af',
  invisible: '#9ca3af',
};

export const glowColors: Record<OnlineStatus, string> = {
  online: 'rgba(34,197,94,0.6)',
  idle: 'rgba(234,179,8,0.5)',
  dnd: 'rgba(239,68,68,0.5)',
  offline: 'transparent',
  invisible: 'transparent',
};

export const statusConfig: Record<OnlineStatus, { color: string; bgColor: string; label: string }> = {
  online: { color: 'bg-green-500', bgColor: 'bg-green-500/20', label: 'Online' },
  idle: { color: 'bg-yellow-500', bgColor: 'bg-yellow-500/20', label: 'Away' },
  dnd: { color: 'bg-red-500', bgColor: 'bg-red-500/20', label: 'Do Not Disturb' },
  offline: { color: 'bg-gray-400', bgColor: 'bg-gray-400/20', label: 'Offline' },
  invisible: { color: 'bg-gray-400', bgColor: 'bg-gray-400/20', label: 'Invisible' },
};

export const sizeConfig = {
  xs: { dot: 'w-2 h-2', ring: 'w-3 h-3', text: 'text-xs' },
  sm: { dot: 'w-2.5 h-2.5', ring: 'w-4 h-4', text: 'text-xs' },
  md: { dot: 'w-3 h-3', ring: 'w-5 h-5', text: 'text-sm' },
  lg: { dot: 'w-4 h-4', ring: 'w-6 h-6', text: 'text-base' },
} as const;

export function formatLastActive(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatLastActiveLong(dateStr: string | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `Active ${diffMins} min ago`;
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  if (diffDays < 7) return `Active ${diffDays} days ago`;
  return `Last seen ${date.toLocaleDateString()}`;
}
