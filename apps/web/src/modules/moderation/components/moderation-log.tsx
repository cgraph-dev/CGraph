/**
 * ModerationLog — Displays audit trail of moderation actions
 *
 * Shows a chronological log of all moderation actions taken
 * by moderators across the platform.
 *
 * @module modules/moderation/components/ModerationLog
 */

import { useEffect, memo } from 'react';
import { useModerationStore } from '../store';
import type { ModerationLogEntry } from '../store/moderationStore.types';

// ── Constants ────────────────────────────────────────────────────────

const ACTION_ICONS: Record<string, string> = {
  approve: '✅',
  reject: '❌',
  warn: '⚠️',
  ban: '🚫',
  unban: '🔓',
  delete: '🗑️',
  lock: '🔒',
  unlock: '🔓',
  pin: '📌',
  move: '📁',
  merge: '🔗',
  split: '✂️',
};

// ── Sub-component ────────────────────────────────────────────────────

interface LogEntryRowProps {
  entry: ModerationLogEntry;
}

const LogEntryRow = memo(function LogEntryRow({ entry }: LogEntryRowProps) {
  const icon = ACTION_ICONS[entry.action] ?? '📋';
  const date = new Date(entry.createdAt);

  return (
    <div className="flex items-start gap-3 border-b border-gray-800 py-3 last:border-b-0">
      <span className="mt-0.5 text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white">
          <span className="font-medium">{entry.moderatorUsername}</span>{' '}
          <span className="text-gray-400">{entry.action}</span>{' '}
          <span className="text-gray-300">{entry.targetType}</span>
          {entry.targetTitle && (
            <span className="text-gray-400"> &quot;{entry.targetTitle}&quot;</span>
          )}
        </p>
        {entry.reason && <p className="mt-0.5 text-xs text-gray-500">Reason: {entry.reason}</p>}
      </div>
      <time className="shrink-0 text-xs text-gray-600" dateTime={entry.createdAt}>
        {date.toLocaleDateString()}{' '}
        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </time>
    </div>
  );
});

// ── Main Component ───────────────────────────────────────────────────

/**
 * unknown for the moderation module.
 */
/**
 * Moderation Log component.
 */
export function ModerationLog() {
  const { moderationLog, isLoadingLog, fetchModerationLog } = useModerationStore();

  useEffect(() => {
    void fetchModerationLog();
  }, [fetchModerationLog]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Moderation Log</h2>

      {isLoadingLog && <div className="py-8 text-center text-gray-500">Loading log…</div>}

      {!isLoadingLog && moderationLog.length === 0 && (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.04]/30 py-8 text-center text-gray-500">
          No moderation actions recorded
        </div>
      )}

      {!isLoadingLog && moderationLog.length > 0 && (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4">
          {moderationLog.map((entry) => (
            <LogEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
