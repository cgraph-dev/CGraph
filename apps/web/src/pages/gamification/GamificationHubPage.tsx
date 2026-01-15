/**
 * Gamification Hub Page
 * 
 * Central dashboard for all gamification features with overview stats,
 * quick actions, and navigation to detailed views.
 * 
 * @version 1.0.0
 * @since v0.8.3
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  ChartBarIcon,
  StarIcon,
  ArrowRightIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useGamificationStore } from '@/stores/gamificationStore';
import LevelProgress from '@/components/gamification/LevelProgress';
import { TitleBadge } from '@/components/gamification/TitleBadge';
import QuestPanel from '@/components/gamification/QuestPanel';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';

// ==================== STAT CARD ====================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  gradient: string;
  delay?: number;
}

function StatCard({ icon, label, value, subtext, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard className="p-4 h-full">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient}`}>
            {icon}
          </div>
          {subtext && (
            <span className="text-xs text-gray-500">{subtext}</span>
          )}
        </div>
        <p className="text-2xl font-bold text-white mt-3">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </GlassCard>
    </motion.div>
  );
}

// ==================== QUICK LINK CARD ====================

interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}

function QuickLink({ to, icon, title, description, gradient, delay = 0 }: QuickLinkProps) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        navigate(to);
        HapticFeedback.medium();
      }}
      className="cursor-pointer"
    >
      <GlassCard variant="holographic" className="p-4 flex items-center gap-4 group">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        <ArrowRightIcon className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
      </GlassCard>
    </motion.div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function GamificationHubPage() {
  const {
    totalXP,
    loginStreak,
    achievements,
    activeQuests,
    equippedTitle,
    fetchGamificationData,
    checkDailyLogin,
  } = useGamificationStore();

  // Fetch data on mount
  useEffect(() => {
    fetchGamificationData();
    checkDailyLogin();
  }, [fetchGamificationData, checkDailyLogin]);

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const totalAchievements = ACHIEVEMENT_DEFINITIONS.length;
  const completableQuests = activeQuests.filter(q => q.completed && !q.completedAt).length;

  return (
    <div className="flex-1 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 overflow-y-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 to-transparent" />
        
        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        ))}
        
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <SparklesIcon className="h-12 w-12 text-yellow-400" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-primary-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Gamification Hub
            </h1>
            <p className="text-gray-400">Track your progress, earn rewards, and level up!</p>
          </motion.div>

          {/* Level Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <LevelProgress variant="expanded" showStreak />
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BoltIcon className="h-5 w-5 text-white" />}
            label="Total XP"
            value={(totalXP ?? 0).toLocaleString()}
            gradient="from-purple-500 to-pink-500"
            delay={0.1}
          />
          <StatCard
            icon={<TrophyIcon className="h-5 w-5 text-white" />}
            label="Achievements"
            value={`${unlockedAchievements}/${totalAchievements}`}
            subtext={`${Math.round((unlockedAchievements / totalAchievements) * 100)}%`}
            gradient="from-yellow-500 to-orange-500"
            delay={0.15}
          />
          <StatCard
            icon={<FireIcon className="h-5 w-5 text-white" />}
            label="Login Streak"
            value={`${loginStreak} days`}
            gradient="from-orange-500 to-red-500"
            delay={0.2}
          />
          <StatCard
            icon={<ClipboardDocumentListIcon className="h-5 w-5 text-white" />}
            label="Active Quests"
            value={activeQuests.length}
            subtext={completableQuests > 0 ? `${completableQuests} ready!` : undefined}
            gradient="from-blue-500 to-cyan-500"
            delay={0.25}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Links */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-primary-400" />
              Quick Access
            </h2>
            
            <QuickLink
              to="/achievements"
              icon={<TrophyIcon className="h-5 w-5 text-white" />}
              title="Achievements"
              description={`${unlockedAchievements} unlocked`}
              gradient="from-yellow-500 to-orange-500"
              delay={0.3}
            />
            
            <QuickLink
              to="/quests"
              icon={<ClipboardDocumentListIcon className="h-5 w-5 text-white" />}
              title="Quests"
              description={`${activeQuests.length} active quests`}
              gradient="from-blue-500 to-cyan-500"
              delay={0.35}
            />
            
            <QuickLink
              to="/titles"
              icon={<TagIcon className="h-5 w-5 text-white" />}
              title="Titles"
              description="Customize your display"
              gradient="from-purple-500 to-pink-500"
              delay={0.4}
            />
            
            <QuickLink
              to="/leaderboard"
              icon={<ChartBarIcon className="h-5 w-5 text-white" />}
              title="Leaderboard"
              description="Global rankings"
              gradient="from-green-500 to-emerald-500"
              delay={0.45}
            />

            {/* Equipped Title */}
            {equippedTitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <GlassCard className="p-4">
                  <p className="text-xs text-gray-500 mb-2">Current Title</p>
                  <TitleBadge title={equippedTitle.id} size="md" />
                </GlassCard>
              </motion.div>
            )}
          </div>

          {/* Right Column - Active Quests */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5 text-blue-400" />
                Active Quests
              </h2>
              <Link
                to="/quests"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
              >
                View all
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <QuestPanel variant="compact" maxQuests={3} />
            </motion.div>
          </div>
        </div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 text-yellow-400" />
              Recent Achievements
            </h2>
            <Link
              to="/achievements"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {achievements
              .filter(a => a.unlocked)
              .sort((a, b) => {
                const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
                const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 6)
              .map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-center cursor-pointer"
                  onClick={() => HapticFeedback.light()}
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <p className="text-xs text-white font-medium mt-1 truncate">{achievement.title}</p>
                </motion.div>
              ))}
            
            {achievements.filter(a => a.unlocked).length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No achievements unlocked yet. Start exploring!
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
