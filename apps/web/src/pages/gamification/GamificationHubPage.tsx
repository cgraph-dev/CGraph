/**
 * Gamification Hub Page
 *
 * Central dashboard for all gamification features with overview stats,
 * quick actions, and navigation to detailed views.
 *
 * @version 1.1.0
 * @since v0.8.3
 */

import { Link } from 'react-router-dom';
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
import { GlassCard } from '@/shared/components/ui';
import LevelProgress from '@/modules/gamification/components/LevelProgress';
import { TitleBadge } from '@/modules/gamification/components/TitleBadge';
import QuestPanel from '@/modules/gamification/components/QuestPanel';
import { useGamificationHub } from '@/pages/gamification/useGamificationHub';
import { StatCard } from '@/pages/gamification/components/StatCard';
import { QuickLink } from '@/pages/gamification/components/QuickLink';
import { RecentAchievements } from '@/pages/gamification/components/RecentAchievements';

export default function GamificationHubPage() {
  const {
    totalXP,
    loginStreak,
    activeQuests,
    equippedTitle,
    unlockedAchievements,
    totalAchievements,
    completableQuests,
    recentAchievements,
  } = useGamificationHub();

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 to-transparent" />

        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary-400/30"
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

        <div className="relative mx-auto max-w-6xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="mb-4 inline-block"
            >
              <SparklesIcon className="h-12 w-12 text-yellow-400" />
            </motion.div>
            <h1 className="mb-2 bg-gradient-to-r from-yellow-400 via-primary-400 to-purple-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Gamification Hub
            </h1>
            <p className="text-gray-400">Track your progress, earn rewards, and level up!</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-2xl"
          >
            <LevelProgress variant="expanded" showStreak />
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Quick Links */}
          <div className="space-y-4 lg:col-span-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
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

            {equippedTitle && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <GlassCard className="p-4">
                  <p className="mb-2 text-xs text-gray-500">Current Title</p>
                  <TitleBadge title={equippedTitle.id} size="md" />
                </GlassCard>
              </motion.div>
            )}
          </div>

          {/* Right Column - Active Quests */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <ClipboardDocumentListIcon className="h-5 w-5 text-blue-400" />
                Active Quests
              </h2>
              <Link
                to="/quests"
                className="flex items-center gap-1 text-sm text-primary-400 transition-colors hover:text-primary-300"
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

        <RecentAchievements recentAchievements={recentAchievements} />
      </div>
    </div>
  );
}
