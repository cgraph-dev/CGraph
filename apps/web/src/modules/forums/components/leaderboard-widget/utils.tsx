/**
 * LeaderboardWidget - Utility/helper functions
 */
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';

/**
 * Formats pulse numbers into compact display strings.
 */
export function formatPulse(pulse: number): string {
  if (pulse >= 1000000) return `${(pulse / 1000000).toFixed(1)}M`;
  if (pulse >= 1000) return `${(pulse / 1000).toFixed(1)}K`;
  return pulse.toString();
}

/**
 * Returns a styled rank badge element for the given rank position.
 */
export function getRankIcon(rank: number) {
  if (rank === 1) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-sm">
        <TrophyIconSolid className="h-3 w-3 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500">
        <span className="text-xs font-bold text-white">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
        <span className="text-xs font-bold text-white">3</span>
      </div>
    );
  }
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08]">
      <span className="text-xs font-medium text-gray-400">{rank}</span>
    </div>
  );
}

/**
 * Derives the best display identifier for a user with multiple fallback layers.
 * Priority: displayName > username > userId truncated > Anonymous
 */
export function deriveUserDisplayInfo(
  displayName: string | null | undefined,
  username: string | null | undefined,
  userId?: string
): { name: string; handle: string; initial: string } {
  const effectiveDisplayName = displayName?.trim() || null;
  const effectiveUsername = username?.trim() || null;

  // Determine the primary display name
  const name =
    effectiveDisplayName ||
    effectiveUsername ||
    (userId ? `User-${userId.slice(0, 8)}` : 'Anonymous');

  // Determine the handle (username or fallback)
  const handle = effectiveUsername || (userId ? userId.slice(0, 8) : 'unknown');

  // Determine the avatar initial letter
  const initial = (effectiveDisplayName?.[0] || effectiveUsername?.[0] || '?').toUpperCase();

  return { name, handle, initial };
}
