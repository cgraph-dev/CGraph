/**
 * Poll widget utility functions.
 * @module
 */

/** Calculate vote percentage. */
export function getVotePercentage(votes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return Math.round((votes / totalVotes) * 100);
}

/** Format remaining time for a poll timeout. */
export function formatPollTimeRemaining(timeout: string | undefined): string {
  if (!timeout) return '';
  const now = new Date();
  const end = new Date(timeout);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return 'Ending soon';
}
