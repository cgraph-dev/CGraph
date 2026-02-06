/**
 * User Profile Card Constants
 *
 * Configuration constants for the profile card behavior
 */

/**
 * Hover delay in milliseconds before showing mini card
 */
export const HOVER_DELAY_MS = 500;

/**
 * Default placeholder user when data is loading
 */
export const DEFAULT_PLACEHOLDER_USER = {
  id: '',
  username: 'Loading...',
  displayName: 'Loading...',
  avatarUrl: '',
  level: 0,
  xp: 0,
  xpToNextLevel: 100,
  karma: 0,
  streak: 0,
  isOnline: false,
} as const;

/**
 * Maximum number of mutual friends to display
 */
export const MAX_MUTUAL_FRIENDS_DISPLAY = 5;

/**
 * Maximum number of badges to display
 */
export const MAX_BADGES_DISPLAY = 3;

/**
 * Maximum number of shared forums to display
 */
export const MAX_SHARED_FORUMS_DISPLAY = 3;
