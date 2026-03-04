/**
 * Warning Panel
 *
 * Issue warnings to users and view warning history.
 *
 * @module modules/forums/components/forum-moderation/warning-panel
 */
import { useState, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import toast from 'react-hot-toast';

const logger = createLogger('WarningPanel');

interface WarningPanelProps {
  forumId: string;
}

interface ForumWarning {
  id: string;
  reason: string;
  points: number;
  expires_at: string | null;
  acknowledged: boolean;
  revoked: boolean;
  issued_by_id: string;
  inserted_at: string;
}

/**
 * Warning panel — issue warnings and view history.
 */
export default function WarningPanel({ forumId }: WarningPanelProps) {
  const [userId, setUserId] = useState('');
  const [warnings, setWarnings] = useState<ForumWarning[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Warning form state
  const [warnReason, setWarnReason] = useState('');
  const [warnPoints, setWarnPoints] = useState(1);
  const [isIssuing, setIsIssuing] = useState(false);

  const loadWarnings = useCallback(async () => {
    if (!userId.trim()) return;
    setIsLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const response = await api.get(
        `/api/v1/forums/${forumId}/moderation/warnings?user_id=${userId}`
      );
      setWarnings(response.data?.data || []);
      setTotalPoints(response.data?.total_points || 0);
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'loadWarnings');
      toast.error('Failed to load warnings');
    } finally {
      setIsLoading(false);
    }
  }, [forumId, userId]);

  const issueWarning = useCallback(async () => {
    if (!userId.trim() || !warnReason.trim()) {
      toast.error('User ID and reason are required');
      return;
    }
    setIsIssuing(true);
    try {
      const { api } = await import('@/lib/api');
      await api.post(`/api/v1/forums/${forumId}/moderation/warn`, {
        user_id: userId,
        reason: warnReason,
        points: warnPoints,
      });
      toast.success('Warning issued');
      setWarnReason('');
      setWarnPoints(1);
      loadWarnings();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'issueWarning');
      toast.error('Failed to issue warning');
    } finally {
      setIsIssuing(false);
    }
  }, [forumId, userId, warnReason, warnPoints, loadWarnings]);

  return (
    <div className="space-y-6">
      {/* User Lookup */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID…"
          className="flex-1 rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
        />
        <button
          onClick={loadWarnings}
          disabled={isLoading}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading…' : 'Look Up'}
        </button>
      </div>

      {/* Warning Points Summary */}
      {totalPoints > 0 && (
        <div
          className={`rounded-lg p-3 text-sm font-medium ${
            totalPoints >= 10
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : totalPoints >= 6
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                : totalPoints >= 3
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-white/[0.04] dark:text-gray-300'
          }`}
        >
          Active warning points: {totalPoints}
          {totalPoints >= 10 && ' — Permanent ban threshold'}
          {totalPoints >= 6 && totalPoints < 10 && ' — Temp ban threshold (7d)'}
          {totalPoints >= 3 && totalPoints < 6 && ' — Mute threshold (24h)'}
        </div>
      )}

      {/* Issue Warning Form */}
      {userId.trim() && (
        <div className="rounded-lg border p-4 dark:border-white/[0.08] space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">Issue Warning</h4>
          <textarea
            value={warnReason}
            onChange={(e) => setWarnReason(e.target.value)}
            placeholder="Warning reason…"
            rows={3}
            className="w-full rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
          />
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-500">Points (1–5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={warnPoints}
                onChange={(e) => setWarnPoints(Math.min(5, Math.max(1, Number(e.target.value))))}
                className="w-20 rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
              />
            </div>
            <button
              onClick={issueWarning}
              disabled={isIssuing}
              className="rounded bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isIssuing ? 'Issuing…' : 'Issue Warning'}
            </button>
          </div>
        </div>
      )}

      {/* Warning History */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">Warning History</h4>
          {warnings.map((w) => (
            <div
              key={w.id}
              className={`rounded-lg border p-3 dark:border-white/[0.08] ${
                w.revoked ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {w.reason}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    w.revoked
                      ? 'bg-gray-200 text-gray-500'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {w.revoked ? 'Revoked' : `${w.points} pt${w.points > 1 ? 's' : ''}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(w.inserted_at).toLocaleString()}
                {w.expires_at && ` · Expires ${new Date(w.expires_at).toLocaleDateString()}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
