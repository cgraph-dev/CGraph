/**
 * Achievements Page
 * 
 * Full achievements browser with category filtering, progress tracking,
 * and unlock celebrations. Connects to gamificationStore for real-time data.
 * 
 * @version 1.0.0
 * @since v0.8.3
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  LockClosedIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useGamificationStore, type Achievement, type AchievementCategory, type AchievementRarity } from '@/stores/gamificationStore';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';
import { TitleBadge } from '@/components/gamification/TitleBadge';
import LevelProgress from '@/components/gamification/LevelProgress';

// ==================== TYPES ====================

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
}

// ==================== CONSTANTS ====================

const CATEGORIES: { id: AchievementCategory | 'all'; name: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', name: 'All', icon: <SparklesIcon className="h-4 w-4" />, color: 'from-purple-500 to-pink-500' },
  { id: 'social', name: 'Social', icon: <TrophyIcon className="h-4 w-4" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'content', name: 'Content', icon: <StarIcon className="h-4 w-4" />, color: 'from-green-500 to-emerald-500' },
  { id: 'exploration', name: 'Exploration', icon: <MagnifyingGlassIcon className="h-4 w-4" />, color: 'from-orange-500 to-yellow-500' },
  { id: 'mastery', name: 'Mastery', icon: <FireIcon className="h-4 w-4" />, color: 'from-red-500 to-orange-500' },
  { id: 'legendary', name: 'Legendary', icon: <TrophySolidIcon className="h-4 w-4" />, color: 'from-yellow-500 to-amber-500' },
  { id: 'secret', name: 'Secret', icon: <LockClosedIcon className="h-4 w-4" />, color: 'from-gray-500 to-gray-600' },
];

const RARITY_COLORS: Record<AchievementRarity, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-400', glow: 'shadow-gray-500/20' },
  uncommon: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', glow: 'shadow-green-500/30' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', glow: 'shadow-purple-500/40' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: 'shadow-yellow-500/50' },
  mythic: { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400', glow: 'shadow-pink-500/50' },
};

const RARITY_ORDER: AchievementRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// ==================== ACHIEVEMENT CARD ====================

function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const colors = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;
  const progressPercent = achievement.maxProgress > 0 
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
      className={`relative p-4 rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 ${colors.bg} border ${colors.border} ${achievement.unlocked ? `shadow-lg ${colors.glow}` : 'opacity-80 grayscale-[30%]'}`}
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold truncate ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
              {achievement.isHidden && !achievement.unlocked ? 'Hidden Achievement' : achievement.title}
            </h3>
            {achievement.unlocked && (
              <CheckCircleIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
            {achievement.isHidden && !achievement.unlocked 
              ? 'Complete hidden objectives to reveal...' 
              : achievement.description}
          </p>
          
          {/* Progress bar */}
          {!achievement.unlocked && achievement.maxProgress > 1 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>Progress</span>
                <span>{achievement.progress} / {achievement.maxProgress}</span>
              </div>
              <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${CATEGORIES.find(c => c.id === achievement.category)?.color || 'from-purple-500 to-pink-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
          
          {/* Rewards */}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
              {achievement.rarity}
            </span>
            {achievement.xpReward > 0 && (
              <span className="text-[10px] text-purple-400 font-medium">
                +{achievement.xpReward} XP
              </span>
            )}
            {achievement.titleReward && (
              <span className="text-[10px] text-yellow-400 font-medium">
                🏷️ Title
              </span>
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

// ==================== MAIN COMPONENT ====================

export default function AchievementsPage() {
  const { achievements, fetchAchievements, isLoadingAchievements } = useGamificationStore();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Fetch achievements on mount
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Merge store achievements with definitions for complete data
  const mergedAchievements = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.map(def => {
      const storeAchievement = achievements.find(a => a.id === def.id);
      return {
        ...def,
        progress: storeAchievement?.progress || 0,
        unlocked: storeAchievement?.unlocked || false,
        unlockedAt: storeAchievement?.unlockedAt,
      } as Achievement;
    });
  }, [achievements]);

  // Filter and search
  const filteredAchievements = useMemo(() => {
    return mergedAchievements.filter(achievement => {
      // Category filter
      if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false;
      
      // Rarity filter
      if (selectedRarity !== 'all' && achievement.rarity !== selectedRarity) return false;
      
      // Unlocked filter
      if (showUnlockedOnly && !achievement.unlocked) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = achievement.title.toLowerCase().includes(query);
        const matchesDesc = achievement.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      
      return true;
    });
  }, [mergedAchievements, selectedCategory, selectedRarity, showUnlockedOnly, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const unlocked = mergedAchievements.filter(a => a.unlocked).length;
    const total = mergedAchievements.length;
    const totalXPEarned = mergedAchievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.xpReward, 0);
    const byRarity = RARITY_ORDER.reduce((acc, rarity) => {
      acc[rarity] = {
        unlocked: mergedAchievements.filter(a => a.rarity === rarity && a.unlocked).length,
        total: mergedAchievements.filter(a => a.rarity === rarity).length,
      };
      return acc;
    }, {} as Record<AchievementRarity, { unlocked: number; total: number }>);
    
    return { unlocked, total, totalXPEarned, byRarity };
  }, [mergedAchievements]);

  return (
    <div className="flex-1 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-dark-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrophyIcon className="h-8 w-8 text-yellow-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Achievements
                </h1>
                <p className="text-sm text-gray-400">
                  {stats?.unlocked ?? 0} / {stats?.total ?? 0} unlocked • {(stats?.totalXPEarned ?? 0).toLocaleString()} XP earned
                </p>
              </div>
            </div>
            
            {/* Level Progress Mini */}
            <div className="hidden md:block w-64">
              <LevelProgress variant="compact" showStreak={false} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {RARITY_ORDER.map(rarity => {
            const data = stats.byRarity[rarity];
            const colors = RARITY_COLORS[rarity];
            return (
              <motion.button
                key={rarity}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedRarity(selectedRarity === rarity ? 'all' : rarity);
                  HapticFeedback.light();
                }}
                className={`p-3 rounded-xl transition-all ${colors.bg} border ${selectedRarity === rarity ? colors.border : 'border-transparent'}`}
              >
                <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{rarity}</p>
                <p className="text-lg font-bold text-white">{data.unlocked}/{data.total}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(category => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedCategory(category.id);
                  HapticFeedback.light();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'bg-dark-800 text-gray-400 hover:text-white'
                }`}
              >
                {category.icon}
                {category.name}
              </motion.button>
            ))}
          </div>
          
          {/* Toggle unlocked only */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowUnlockedOnly(!showUnlockedOnly);
              HapticFeedback.light();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              showUnlockedOnly
                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : 'bg-dark-800 text-gray-400'
            }`}
          >
            <CheckCircleIcon className="h-4 w-4" />
            Unlocked
          </motion.button>
        </div>

        {/* Achievement Grid */}
        {isLoadingAchievements ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : filteredAchievements.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <TrophyIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No achievements found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
          </GlassCard>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={() => setSelectedAchievement(achievement)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full"
            >
              <GlassCard variant="holographic" glow className="p-6">
                <div className="text-center mb-6">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {selectedAchievement.icon}
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedAchievement.title}</h2>
                  <p className={`text-sm font-bold uppercase tracking-wider ${RARITY_COLORS[selectedAchievement.rarity].text}`}>
                    {selectedAchievement.rarity}
                  </p>
                </div>
                
                <p className="text-gray-300 text-center mb-6">{selectedAchievement.description}</p>
                
                {/* Progress */}
                {selectedAchievement.maxProgress > 1 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{selectedAchievement.progress} / {selectedAchievement.maxProgress}</span>
                    </div>
                    <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Rewards */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  {selectedAchievement.xpReward > 0 && (
                    <div className="text-center">
                      <SparklesIcon className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">+{selectedAchievement.xpReward}</p>
                      <p className="text-xs text-gray-500">XP</p>
                    </div>
                  )}
                  {selectedAchievement.titleReward && (
                    <div className="text-center">
                      <TrophyIcon className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
                      <TitleBadge title={selectedAchievement.titleReward} size="sm" />
                    </div>
                  )}
                </div>
                
                {/* Status */}
                {selectedAchievement.unlocked ? (
                  <div className="text-center p-3 rounded-xl bg-green-500/20 border border-green-500/40">
                    <CheckCircleIcon className="h-6 w-6 text-green-400 mx-auto mb-1" />
                    <p className="text-green-400 font-medium">Unlocked!</p>
                    {selectedAchievement.unlockedAt && (
                      <p className="text-xs text-green-400/70">
                        {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-3 rounded-xl bg-dark-800 border border-dark-700">
                    <LockClosedIcon className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                    <p className="text-gray-400 font-medium">Locked</p>
                    <p className="text-xs text-gray-500">Keep progressing to unlock!</p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
