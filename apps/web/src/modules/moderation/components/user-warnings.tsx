/**
 * UserWarnings — Display and manage warnings for a user
 *
 * Shows active/expired warnings, total points, and allows
 * issuing or revoking warnings.
 *
 * @module modules/moderation/components/UserWarnings
 */

import { useEffect, useCallback, memo } from 'react';
import { useModerationStore } from '../store';
import type { UserWarning } from '../store/moderationStore.types';

// ── Sub-component ────────────────────────────────────────────────────

interface WarningCardProps {
  warning: UserWarning;
  onRevoke: (warningId: string) => void;
}

const WarningCard = memo(function WarningCard({ warning, onRevoke }: WarningCardProps) {
  const isExpired = warning.expiresAt && new Date(warning.expiresAt) < new Date();
  const statusColor = warning.isRevoked
    ? 'text-gray-500'
    : isExpired
      ? 'text-yellow-500'
      : 'text-red-400';

  return (
    <div
      className={`rounded-lg border p-3 ${warning.isActive ? 'border-red-800/40 bg-red-900/10' : 'border-gray-700 bg-gray-800/30'}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-white">{warning.warningTypeName}</span>
        <span className={`text-xs font-medium ${statusColor}`}>
          {warning.isRevoked ? 'Revoked' : isExpired ? 'Expired' : `${warning.points} pts`}
        </span>
      </div>

      <p className="mb-2 text-xs text-gray-400">{warning.reason}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          By {warning.issuedByUsername} · {new Date(warning.issuedAt).toLocaleDateString()}
        </span>
        {warning.isActive && !warning.isRevoked && (
          <button
            type="button"
            onClick={() => onRevoke(warning.id)}
            className="text-yellow-500 hover:text-yellow-400"
          >
            Revoke
          </button>
        )}
      </div>
    </div>
  );
});

// ── Main Component ───────────────────────────────────────────────────

interface UserWarningsProps {
  userId: string;
}

/**
 * unknown for the moderation module.
 */
/**
 * User Warnings component.
 */
export function UserWarnings({ userId }: UserWarningsProps) {
  const { currentUserWarnings, currentUserStats, fetchUserWarnings, revokeWarning } =
    useModerationStore();

  useEffect(() => {
    void fetchUserWarnings(userId);
  }, [fetchUserWarnings, userId]);

  const handleRevoke = useCallback(
    (warningId: string) => void revokeWarning(warningId, 'Revoked by moderator'),
    [revokeWarning]
  );

  const activeWarnings = currentUserWarnings.filter((w) => w.isActive && !w.isRevoked);
  const inactiveWarnings = currentUserWarnings.filter((w) => !w.isActive || w.isRevoked);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">User Warnings</h3>
        {currentUserStats && (
          <div className="flex gap-3 text-sm">
            <span className="text-gray-400">
              Points:{' '}
              <span className="font-medium text-white">{currentUserStats.warningPoints}</span>
            </span>
            <span className="text-gray-400">
              Active:{' '}
              <span className="font-medium text-red-400">{currentUserStats.activeWarnings}</span>
            </span>
          </div>
        )}
      </div>

      {activeWarnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-400">Active Warnings</h4>
          {activeWarnings.map((w) => (
            <WarningCard key={w.id} warning={w} onRevoke={handleRevoke} />
          ))}
        </div>
      )}

      {inactiveWarnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Past Warnings</h4>
          {inactiveWarnings.map((w) => (
            <WarningCard key={w.id} warning={w} onRevoke={handleRevoke} />
          ))}
        </div>
      )}

      {currentUserWarnings.length === 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/30 py-6 text-center text-gray-500">
          No warnings issued
        </div>
      )}
    </div>
  );
}
