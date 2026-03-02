/**
 * ModeratorLeaderboard — Top moderators by action count
 *
 * Displays a ranked table of the most active moderators
 * with action count and last activity timestamp.
 *
 * @module modules/moderation/components/ModeratorLeaderboard
 */

import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ── Types ────────────────────────────────────────────────────────────

interface ModeratorEntry {
  reviewer_id: string;
  username?: string;
  display_name?: string;
  actions_count: number;
  last_action: string;
}

interface ModeratorLeaderboardProps {
  data: ModeratorEntry[];
}

// ── Component ────────────────────────────────────────────────────────

/**
 * Moderator leaderboard table showing top moderators by actions this month.
 */
export function ModeratorLeaderboard({ data }: ModeratorLeaderboardProps) {
  const entries = data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderator Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">No moderator activity</p>
        ) : (
          <div className="space-y-2">
            {entries.map((mod, index) => (
              <div
                key={mod.reviewer_id}
                className="flex items-center justify-between rounded-lg bg-dark-700/50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : index === 1
                          ? 'bg-gray-400/20 text-gray-300'
                          : index === 2
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-dark-600 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Avatar placeholder + name */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                      {(mod.display_name || mod.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {mod.display_name || mod.username || 'Unknown'}
                      </p>
                      {mod.username && mod.display_name && mod.display_name !== mod.username && (
                        <p className="text-xs text-gray-500">@{mod.username}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{mod.actions_count}</p>
                  <p className="text-xs text-gray-500">
                    {mod.last_action
                      ? new Date(mod.last_action).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
