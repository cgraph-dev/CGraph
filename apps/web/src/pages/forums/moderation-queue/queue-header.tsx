/**
 * QueueHeader component
 * @module pages/forums/moderation-queue
 */

import { ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { QueueCounts } from './types';

interface QueueHeaderProps {
  queueCounts: QueueCounts;
  isLoading: boolean;
  onRefresh: () => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Queue Header component.
 */
export function QueueHeader({ queueCounts, isLoading, onRefresh }: QueueHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
          <ShieldCheckIcon className="h-7 w-7 text-primary-400" />
          Moderation Queue
        </h1>
        <p className="mt-1 text-gray-400">Review and moderate pending content</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Queue Stats */}
        <div className="flex gap-3">
          <div className="rounded-lg bg-amber-500/20 px-3 py-2 text-center">
            <div className="text-lg font-bold text-amber-400">{queueCounts.pending}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="rounded-lg bg-red-500/20 px-3 py-2 text-center">
            <div className="text-lg font-bold text-red-400">{queueCounts.reported}</div>
            <div className="text-xs text-gray-400">Reported</div>
          </div>
          <div className="rounded-lg bg-purple-500/20 px-3 py-2 text-center">
            <div className="text-lg font-bold text-purple-400">{queueCounts.flagged}</div>
            <div className="text-xs text-gray-400">Flagged</div>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-lg bg-dark-700 p-2.5 text-gray-400 transition-colors hover:bg-dark-600 hover:text-white"
        >
          <ArrowPathIcon className={cn('h-5 w-5', isLoading && 'animate-spin')} />
        </button>
      </div>
    </div>
  );
}
