/**
 * BanManager — Manage bans (IP, user, email)
 *
 * Displays active and lifted bans with the ability
 * to lift existing bans.
 *
 * @module modules/moderation/components/BanManager
 */

import { useEffect, useCallback, memo } from 'react';
import { useModerationStore } from '../store';
import type { Ban } from '../store/moderationStore.types';

// ── Sub-component ────────────────────────────────────────────────────

interface BanRowProps {
  ban: Ban;
  onLift: (banId: string) => void;
}

const BanRow = memo(function BanRow({ ban, onLift }: BanRowProps) {
  const isPermanent = !ban.expiresAt;
  const isExpired = ban.expiresAt && new Date(ban.expiresAt) < new Date();

  const target = ban.username ?? ban.email ?? ban.ipAddress ?? 'Unknown';
  const type = ban.username ? 'User' : ban.email ? 'Email' : 'IP';

  return (
    <tr className="border-b border-gray-800 last:border-b-0">
      <td className="py-2 pr-4 text-sm text-white">{target}</td>
      <td className="py-2 pr-4 text-xs text-gray-400">{type}</td>
      <td className="max-w-xs truncate py-2 pr-4 text-xs text-gray-400">{ban.reason}</td>
      <td className="py-2 pr-4 text-xs text-gray-500">{ban.bannedByUsername}</td>
      <td className="py-2 pr-4 text-xs">
        {ban.isLifted ? (
          <span className="text-gray-500">Lifted</span>
        ) : isExpired ? (
          <span className="text-yellow-500">Expired</span>
        ) : isPermanent ? (
          <span className="text-red-400">Permanent</span>
        ) : (
          <span className="text-orange-400">
            Until {new Date(ban.expiresAt!).toLocaleDateString()}
          </span>
        )}
      </td>
      <td className="py-2 text-right">
        {ban.isActive && !ban.isLifted && (
          <button
            type="button"
            onClick={() => onLift(ban.id)}
            className="rounded bg-yellow-600 px-2 py-1 text-xs font-medium text-white hover:bg-yellow-500"
          >
            Lift Ban
          </button>
        )}
      </td>
    </tr>
  );
});

// ── Main Component ───────────────────────────────────────────────────

/**
 * unknown for the moderation module.
 */
/**
 * Ban Manager component.
 */
export function BanManager() {
  const { bans, isLoadingBans, fetchBans, liftBan } = useModerationStore();

  useEffect(() => {
    void fetchBans();
  }, [fetchBans]);

  const handleLift = useCallback(
    (banId: string) => void liftBan(banId, 'Lifted by moderator'),
    [liftBan]
  );

  const activeBans = bans.filter((b) => b.isActive && !b.isLifted);
  const liftedBans = bans.filter((b) => !b.isActive || b.isLifted);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Ban Manager</h2>

      {isLoadingBans && <div className="py-8 text-center text-gray-500">Loading bans…</div>}

      {!isLoadingBans && bans.length === 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/30 py-8 text-center text-gray-500">
          No bans recorded
        </div>
      )}

      {!isLoadingBans && activeBans.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-red-400">
            Active Bans ({activeBans.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/50">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2 pl-4 text-xs font-medium text-gray-400">Target</th>
                  <th className="py-2 text-xs font-medium text-gray-400">Type</th>
                  <th className="py-2 text-xs font-medium text-gray-400">Reason</th>
                  <th className="py-2 text-xs font-medium text-gray-400">Banned By</th>
                  <th className="py-2 text-xs font-medium text-gray-400">Status</th>
                  <th className="py-2 text-xs font-medium text-gray-400" />
                </tr>
              </thead>
              <tbody className="pl-4">
                {activeBans.map((ban) => (
                  <BanRow key={ban.id} ban={ban} onLift={handleLift} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoadingBans && liftedBans.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-500">
            Lifted / Expired ({liftedBans.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/30">
            <table className="w-full text-left">
              <tbody className="pl-4">
                {liftedBans.map((ban) => (
                  <BanRow key={ban.id} ban={ban} onLift={handleLift} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
