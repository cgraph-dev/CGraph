/** AchievementCard — displays a gamification achievement with progress and rarity. */
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { AchievementCardProps } from './types';
import { CATEGORIES, RARITY_COLORS } from './constants';

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const colors = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;
  const progressPercent =
    achievement.maxProgress > 0
      ? Math.min((achievement.progress / achievement.maxProgress) * 100, 100)
      : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        onClick?.();
        HapticFeedback.light();
      }}
      className={`relative cursor-pointer overflow-hidden rounded-2xl p-4 transition-all duration-300 ${colors.bg} border ${colors.border} ${achievement.unlocked ? `shadow-lg ${colors.glow}` : 'opacity-80 grayscale-[30%]'}`}
    >
      {/* Background glow for unlocked */}
      {achievement.unlocked && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50`}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-start gap-3">
        {/* Icon */}
        <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale'}`}>
          {achievement.isHidden && !achievement.unlocked ? '❓' : achievement.icon}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={`truncate font-semibold ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}
            >
              {achievement.isHidden && !achievement.unlocked
                ? 'Hidden Achievement'
                : achievement.title}
            </h3>
            {achievement.unlocked && (
              <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-green-400" />
            )}
          </div>

          <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
            {achievement.isHidden && !achievement.unlocked
              ? 'Complete hidden objectives to reveal...'
              : achievement.description}
          </p>

          {/* Progress bar */}
          {!achievement.unlocked && achievement.maxProgress > 1 && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-[10px] text-gray-500">
                <span>Progress</span>
                <span>
                  {achievement.progress} / {achievement.maxProgress}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-dark-700">
                <motion.div
                  className={`h-full bg-gradient-to-r ${CATEGORIES.find((c) => c.id === achievement.category)?.color || 'from-purple-500 to-pink-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Rewards */}
          <div className="mt-2 flex items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
              {achievement.rarity}
            </span>
            {achievement.xpReward > 0 && (
              <span className="text-[10px] font-medium text-purple-400">
                +{achievement.xpReward} XP
              </span>
            )}
            {achievement.titleReward && (
              <span className="text-[10px] font-medium text-yellow-400">🏷️ Title</span>
            )}
          </div>
        </div>
      </div>

      {/* Unlock date */}
      {achievement.unlocked && achievement.unlockedAt && (
        <div className="absolute bottom-2 right-2 text-[10px] text-gray-500">
          {new Date(achievement.unlockedAt).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
}
