/**
 * Quests customization section.
 * @module
 */
import { motion } from 'framer-motion';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { QuestsSectionProps } from './types';

export function QuestsSection({ quests }: QuestsSectionProps) {
  const getQuestColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'from-blue-500 to-cyan-500';
      case 'weekly':
        return 'from-purple-500 to-pink-500';
      case 'special':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatTimeRemaining = (date?: Date) => {
    if (!date) return '';
    const hours = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60));
    return `${hours}h remaining`;
  };

  return (
    <div className="space-y-3">
      {quests.map((quest, index) => (
        <motion.div
          key={quest.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.04 }}
        >
          <GlassCard
            variant={quest.completed ? 'neon' : 'crystal'}
            glow={quest.completed}
            className={`relative p-4 ${quest.completed ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start gap-3">
              {/* Quest Type Badge */}
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getQuestColor(quest.type)} flex flex-shrink-0 items-center justify-center text-sm font-bold text-white`}
              >
                {quest.type === 'daily' ? 'D' : quest.type === 'weekly' ? 'W' : 'S'}
              </div>

              <div className="flex-1">
                {/* Quest Info */}
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{quest.name}</h4>
                    <p className="text-sm text-white/60">{quest.description}</p>
                  </div>
                  {quest.completed && (
                    <CheckCircleIconSolid className="h-6 w-6 flex-shrink-0 text-green-400" />
                  )}
                </div>

                {/* Progress Bar */}
                {!quest.completed && (
                  <div className="mb-2">
                    <div className="mb-1 flex justify-between text-xs text-white/60">
                      <span>Progress</span>
                      <span>
                        {quest.progress}/{quest.maxProgress}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-dark-700">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${getQuestColor(quest.type)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-medium text-yellow-400">+{quest.reward.xp} XP</span>
                    {quest.reward.coins && (
                      <span className="font-medium text-blue-400">+{quest.reward.coins} Coins</span>
                    )}
                  </div>
                  {quest.expiresAt && !quest.completed && (
                    <span className="text-xs text-red-400">
                      {formatTimeRemaining(quest.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
