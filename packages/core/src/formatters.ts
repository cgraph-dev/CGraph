/**
 * Formatting utilities shared across platforms.
 *
 * @module @cgraph/core/formatters
 */

/**
 * Formats a timestamp into a human-readable relative time string.
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 60_000)); // "1m ago"
 * formatRelativeTime(new Date(Date.now() - 3_600_000)); // "1h ago"
 * ```
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  if (diffMs < 0) {
    return 'just now';
  }

  const seconds = Math.floor(diffMs / 1_000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

/**
 * Formats a byte count into a human-readable file size string.
 *
 * @example
 * ```ts
 * formatFileSize(1024); // "1.0 KB"
 * formatFileSize(1_048_576); // "1.0 MB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / k ** i;

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
