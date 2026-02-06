/**
 * Forum Header Utilities
 *
 * Helper functions for the forum header
 */

/**
 * Format a number with K/M suffix for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Copy current URL to clipboard
 */
export function copyCurrentUrl(): void {
  navigator.clipboard.writeText(window.location.href);
}
