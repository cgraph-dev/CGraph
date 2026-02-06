import { motion } from 'framer-motion';
import { TrophyIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { Quest } from '@/stores/gamificationStore';
import { getQuestProgress, isQuestReady } from './utils';

interface CompactQuestPanelProps {
  className: string;
  displayedQuests: Quest[];
  completedToday: number;
  totalQuests: number;
}

export function CompactQuestPanel({
  className,
  displayedQuests,
  completedToday,
  totalQuests,
}: CompactQuestPanelProps) {
  return (
    <div className={className}>
      <GlassCard variant="frosted" glow className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <TrophyIcon className="h-4 w-4 text-yellow-400" />
            Daily Quests
          </h3>
          <span className="text-xs text-gray-400">
            {completedToday}/{totalQuests}
          </span>
        </div>

        <div className="space-y-2">
          {displayedQuests.slice(0, 3).map((quest) => {
            const progress = getQuestProgress(quest);
            const ready = isQuestReady(quest);

            return (
              <motion.div key={quest.id} className="flex items-center gap-3" whileHover={{ x: 2 }}>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    ready ? 'bg-green-500' : 'bg-dark-700'
                  }`}
                >
                  {ready ? (
                    <CheckCircleSolidIcon className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-gray-300">{quest.title}</p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-dark-700">
                    <motion.div
                      className={`h-full rounded-full ${ready ? 'bg-green-500' : 'bg-primary-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {displayedQuests.length > 3 && (
          <button className="mt-3 flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
            View all quests
            <ChevronRightIcon className="h-3 w-3" />
          </button>
        )}
      </GlassCard>
    </div>
  );
}
