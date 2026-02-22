/**
 * LeaderboardSidebar - Combined widget for sidebar
 * Shows forum-specific when viewing a forum, or global when on the main forums page
 */
import type { LeaderboardSidebarProps } from './types';
import { ForumLeaderboardWidget } from './forum-leaderboard-widget';
import { GlobalLeaderboardWidget } from './global-leaderboard-widget';

export function LeaderboardSidebar({ forumId, forumSlug }: LeaderboardSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Forum-specific leaderboard when viewing a forum */}
      {forumId && forumSlug && (
        <ForumLeaderboardWidget forumId={forumId} forumSlug={forumSlug} limit={5} />
      )}

      {/* Global leaderboard */}
      <GlobalLeaderboardWidget limit={5} />
    </div>
  );
}

export default LeaderboardSidebar;
