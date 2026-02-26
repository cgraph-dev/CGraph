/**
 * LastSeenBadge - Shows "Last seen X ago" for users
 * Respects privacy settings
 */



interface LastSeenBadgeProps {
  lastSeenAt?: string | null;
  status?: string;
  isOnline?: boolean;
  className?: string;
}

/**
 * unknown for the last-seen-badge.tsx module.
 */
/**
 * Last Seen Badge component.
 */
export function LastSeenBadge({ lastSeenAt, status, isOnline, className = '' }: LastSeenBadgeProps) {
  if (isOnline || status === 'online') {
    return <span className={`text-xs text-green-400 ${className}`}>Online</span>;
  }

  if (status === 'dnd') {
    return <span className={`text-xs text-red-400 ${className}`}>Do Not Disturb</span>;
  }

  if (status === 'idle') {
    return <span className={`text-xs text-yellow-400 ${className}`}>Idle</span>;
  }

  if (status === 'invisible') {
    return <span className={`text-xs text-white/30 ${className}`}>Offline</span>;
  }

  if (!lastSeenAt) {
    return <span className={`text-xs text-white/30 ${className}`}>Offline</span>;
  }

  const timeAgo = formatLastSeen(new Date(lastSeenAt));

  return (
    <span className={`text-xs text-white/30 ${className}`}>
      Last seen {timeAgo}
    </span>
  );
}

function formatLastSeen(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
