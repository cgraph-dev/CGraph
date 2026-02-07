/**
 * Leaderboard Sidebar Component
 *
 * Hall of Fame and How It Works sections.
 */

import { ArrowUpIcon, ArrowDownIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import type { Forum } from '@/modules/forums/store';
import { TopForumCard } from './TopForumCard';

interface LeaderboardSidebarProps {
  topForums: Forum[];
}

export function LeaderboardSidebar({ topForums }: LeaderboardSidebarProps) {
  return (
    <div className="hidden w-80 overflow-y-auto border-l border-dark-600 lg:block">
      <div className="p-4">
        <div className="rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4">
          <div className="mb-4 flex items-center gap-2">
            <TrophyIconSolid className="h-6 w-6 text-yellow-500" />
            <h3 className="font-bold text-white">Hall of Fame</h3>
          </div>

          <div className="space-y-3">
            {topForums.map((forum, index) => (
              <TopForumCard key={forum.id} forum={forum} rank={index + 1} />
            ))}
          </div>
        </div>

        {/* About Competition */}
        <div className="mt-4 rounded-lg bg-dark-700 p-4">
          <h3 className="mb-2 font-bold text-white">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <ArrowUpIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <span>Upvote forums you love to help them climb the ranks</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowDownIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <span>Downvote low-quality forums</span>
            </li>
            <li className="flex items-start gap-2">
              <SparklesIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
              <span>Weekly scores reset every Monday</span>
            </li>
            <li className="flex items-start gap-2">
              <TrophyIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
              <span>Top forums get featured status</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
