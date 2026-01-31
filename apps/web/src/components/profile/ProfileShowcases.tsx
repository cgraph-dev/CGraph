import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { rarityColors, defaultRarityColor } from '@/types/profile.types';

interface Achievement {
  id: string;
  title: string;
  icon: string;
  rarity: string;
  unlocked: boolean;
}

interface EquippedBadgesShowcaseProps {
  equippedBadges: string[];
  achievements: Achievement[];
  editMode: boolean;
}

export function EquippedBadgesShowcase({
  equippedBadges,
  achievements,
  editMode,
}: EquippedBadgesShowcaseProps) {
  const navigate = useNavigate();

  if (equippedBadges.length === 0) return null;

  return (
    <GlassCard variant="crystal" glow glowColor="rgba(139, 92, 246, 0.3)" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-lg font-semibold text-transparent">
          <SparklesIcon className="h-5 w-5 text-purple-400" />
          Equipped Badges
        </h2>
        <span className="text-sm text-gray-400">{equippedBadges.length} / 5</span>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <AnimatePresence mode="popLayout">
          {equippedBadges.map((badgeId, index) => {
            const badge = achievements.find((a) => a.id === badgeId);
            if (!badge) return null;

            const colors = rarityColors[badge.rarity] ?? defaultRarityColor;

            return (
              <motion.div
                key={badgeId}
                initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                transition={{
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                whileHover={{ scale: 1.1, y: -4 }}
                className={`relative rounded-2xl p-4 ${colors.bg} border-2 ${colors.border} group cursor-pointer overflow-hidden`}
                onClick={() => HapticFeedback.medium()}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Badge Icon */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <span className="text-4xl drop-shadow-lg">{badge.icon}</span>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">{badge.title}</p>
                    <p
                      className={`text-[9px] font-bold uppercase tracking-wider ${colors.text} mt-0.5`}
                    >
                      {badge.rarity}
                    </p>
                  </div>
                </div>

                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'linear',
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {editMode ? (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            navigate('/customize/identity');
            HapticFeedback.medium();
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-600/20 px-4 py-3 font-medium text-purple-400 transition-colors hover:bg-purple-600/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SparklesIcon className="h-4 w-4" />
          Manage Badges
        </motion.button>
      ) : (
        <p className="mt-4 text-center text-xs text-gray-500">
          Manage your equipped badges in{' '}
          <button
            onClick={() => navigate('/customize/identity')}
            className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
          >
            Customize → Identity
          </button>
        </p>
      )}
    </GlassCard>
  );
}

interface AchievementsShowcaseProps {
  achievements: Achievement[];
  totalUnlocked: number;
  totalAchievements: number;
  showAll: boolean;
  onToggleShowAll: () => void;
}

export function AchievementsShowcase({
  achievements,
  totalUnlocked,
  totalAchievements,
  showAll,
  onToggleShowAll,
}: AchievementsShowcaseProps) {
  if (achievements.length === 0) return null;

  return (
    <GlassCard variant="holographic" glow className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-lg font-semibold text-transparent">
          <TrophyIcon className="h-5 w-5 text-yellow-400" />
          Achievements
        </h2>
        <span className="text-sm text-gray-400">
          {totalUnlocked} / {totalAchievements}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {achievements.map((achievement, index) => {
            const colors = rarityColors[achievement.rarity] ?? defaultRarityColor;
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className={`rounded-xl p-3 ${colors.bg} border ${colors.border} group relative cursor-pointer overflow-hidden`}
                onClick={() => HapticFeedback.light()}
              >
                <div className="relative z-10 flex items-center gap-2">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{achievement.title}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                      {achievement.rarity}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {totalUnlocked > 6 && (
        <motion.button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary-500/30 bg-primary-500/20 py-2 text-sm font-medium text-primary-400 transition-colors hover:bg-primary-500/30"
          onClick={() => {
            onToggleShowAll();
            HapticFeedback.light();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showAll ? 'Show Less' : `View All ${totalUnlocked} Achievements`}
          <SparklesIcon className="h-4 w-4" />
        </motion.button>
      )}
    </GlassCard>
  );
}
