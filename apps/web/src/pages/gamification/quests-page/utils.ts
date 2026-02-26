/**
 * QuestsPage utility functions
 * @module quests-page/utils
 */

/**
 * unknown for the gamification module.
 */
/**
 * Retrieves time left.
 *
 * @param expiresAt - The expires at.
 * @returns The time left.
 */
export function getTimeLeft(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}
