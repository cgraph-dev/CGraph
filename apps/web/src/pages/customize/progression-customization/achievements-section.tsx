/**
 * Achievements customization section.
 * @module
 */
import { motion } from 'framer-motion';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import type { AchievementsSectionProps } from './types';
import { tweens } from '@/lib/animation-presets';

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-500 to-gray-600';
      case 'rare':
        return 'from-blue-500 to-blue-600';
      case 'epic':
        return 'from-purple-500 to-purple-600';
      case 'legendary':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {achievements.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant={achievement.unlocked ? 'neon' : ('frosted' as const)}
            glow={achievement.unlocked}
            glowColor={achievement.unlocked ? 'rgba(139, 92, 246, 0.3)' : undefined}
            className={`relative p-4 ${achievement.unlocked ? '' : 'opacity-70'}`}
          >
            {/* Achievement Icon */}
            <div className="mb-3 flex items-start gap-3">
              <div
                className={`h-16 w-16 rounded-xl bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-3xl`}
              >
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-base font-bold text-white">{achievement.name}</h4>
                <p className="mb-1 text-xs text-white/60">{achievement.description}</p>
                <span
                  className={`text-xs font-medium ${achievement.rarity === 'legendary' ? 'text-yellow-400' : achievement.rarity === 'epic' ? 'text-purple-400' : achievement.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  {achievement.rarity.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {!achievement.unlocked && (
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-white/60">
                  <span>Progress</span>
                  <span>
                    {achievement.progress}/{achievement.maxProgress}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-dark-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-600 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                    }}
                    transition={{ ...tweens.slow, delay: index * 0.05 }}
                  />
                </div>
              </div>
            )}

            {/* Rewards */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/60">Reward:</span>
                <span className="font-medium text-yellow-400">+{achievement.reward.xp} XP</span>
                {achievement.reward.coins && (
                  <span className="font-medium text-blue-400">
                    +{achievement.reward.coins} Coins
                  </span>
                )}
              </div>
              {achievement.unlocked && <CheckCircleIconSolid className="h-5 w-5 text-green-400" />}
            </div>

            {achievement.reward.item && (
              <div className="mt-2 rounded border border-purple-500/30 bg-purple-500/20 px-2 py-1 text-center text-xs text-purple-300">
                🎁 {achievement.reward.item}
              </div>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
