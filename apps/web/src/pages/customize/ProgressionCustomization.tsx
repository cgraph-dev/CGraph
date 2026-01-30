import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  StarIcon,
  ChartBarIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import { useGamificationStore } from '@/stores/gamificationStore';

/**
 * ProgressionCustomization Component
 *
 * Unified gamification hub with 4 sections:
 * 1. Achievements - All unlocked/locked achievements with progress
 * 2. Leaderboards - Global/Friends/Weekly leaderboards
 * 3. Quests - Daily/Weekly/Special quests with rewards
 * 4. Daily Rewards - Streak tracker and reward calendar
 *
 * This replaces the old /gamification routes and consolidates all
 * progression features into the Customize hub.
 *
 * NOTE: This page uses real data from useGamificationStore (level, xp, karma).
 * Achievements, leaderboards, and quests are currently using mock data
 * until the backend APIs are implemented. These will be replaced with
 * real API calls in Phase 3+.
 */

// ==================== TYPE DEFINITIONS ====================

type ProgressionCategory = 'achievements' | 'leaderboards' | 'quests' | 'rewards';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward: {
    xp: number;
    coins?: number;
    item?: string;
  };
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  isCurrentUser?: boolean;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward: {
    xp: number;
    coins?: number;
  };
  expiresAt?: Date;
}

interface DailyReward {
  day: number;
  claimed: boolean;
  reward: {
    xp?: number;
    coins?: number;
    item?: string;
  };
}

// ==================== MOCK DATA (TO BE REPLACED WITH REAL API) ====================

// Note: These are placeholder achievements. In production, these should come from the backend API
// TODO: Create achievements API endpoints and replace this mock data
const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach1',
    name: 'Early Adopter',
    description: 'Join CGraph in the first month',
    icon: '🌟',
    rarity: 'legendary',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    reward: { xp: 500, item: 'Golden Border' },
  },
  {
    id: 'ach2',
    name: 'Social Butterfly',
    description: 'Make 10 friends',
    icon: '👥',
    rarity: 'common',
    progress: 7,
    maxProgress: 10,
    unlocked: false,
    reward: { xp: 100, coins: 50 },
  },
  {
    id: 'ach3',
    name: 'Message Master',
    description: 'Send 1000 messages',
    icon: '💬',
    rarity: 'rare',
    progress: 847,
    maxProgress: 1000,
    unlocked: false,
    reward: { xp: 250, coins: 100 },
  },
  {
    id: 'ach4',
    name: 'Forum Legend',
    description: 'Create 100 forum posts',
    icon: '📝',
    rarity: 'epic',
    progress: 42,
    maxProgress: 100,
    unlocked: false,
    reward: { xp: 350, item: 'Forum Master Title' },
  },
  {
    id: 'ach5',
    name: 'Streak King',
    description: '30 day login streak',
    icon: '🔥',
    rarity: 'legendary',
    progress: 12,
    maxProgress: 30,
    unlocked: false,
    reward: { xp: 500, item: 'Flame Border' },
  },
  {
    id: 'ach6',
    name: 'Reaction Expert',
    description: 'React to 500 messages',
    icon: '❤️',
    rarity: 'common',
    progress: 312,
    maxProgress: 500,
    unlocked: false,
    reward: { xp: 150, coins: 75 },
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: '1',
    username: 'GamingLegend',
    displayName: 'Gaming Legend',
    level: 42,
    xp: 125430,
  },
  {
    rank: 2,
    userId: '2',
    username: 'ProGamer',
    displayName: 'Pro Gamer',
    level: 40,
    xp: 118240,
  },
  {
    rank: 3,
    userId: '3',
    username: 'ElitePlayer',
    displayName: 'Elite Player',
    level: 38,
    xp: 112850,
  },
  {
    rank: 4,
    userId: 'current',
    username: 'You',
    displayName: 'You',
    level: 25,
    xp: 67500,
    isCurrentUser: true,
  },
  {
    rank: 5,
    userId: '5',
    username: 'CasualUser',
    displayName: 'Casual User',
    level: 22,
    xp: 58320,
  },
];

const MOCK_QUESTS: Quest[] = [
  {
    id: 'quest1',
    name: 'Daily Chatter',
    description: 'Send 20 messages today',
    type: 'daily',
    progress: 14,
    maxProgress: 20,
    completed: false,
    reward: { xp: 50, coins: 25 },
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  {
    id: 'quest2',
    name: 'Social Hour',
    description: 'React to 10 messages',
    type: 'daily',
    progress: 10,
    maxProgress: 10,
    completed: true,
    reward: { xp: 30, coins: 15 },
  },
  {
    id: 'quest3',
    name: 'Weekly Warrior',
    description: 'Login 5 days this week',
    type: 'weekly',
    progress: 3,
    maxProgress: 5,
    completed: false,
    reward: { xp: 200, coins: 100 },
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'quest4',
    name: 'Forum Explorer',
    description: 'Visit 3 different forums',
    type: 'daily',
    progress: 2,
    maxProgress: 3,
    completed: false,
    reward: { xp: 40, coins: 20 },
  },
  {
    id: 'quest5',
    name: 'Community Builder',
    description: 'Help 5 new users',
    type: 'special',
    progress: 1,
    maxProgress: 5,
    completed: false,
    reward: { xp: 500, coins: 250 },
  },
];

const MOCK_DAILY_REWARDS: DailyReward[] = [
  { day: 1, claimed: true, reward: { xp: 50, coins: 25 } },
  { day: 2, claimed: true, reward: { xp: 60, coins: 30 } },
  { day: 3, claimed: true, reward: { xp: 70, coins: 35 } },
  { day: 4, claimed: true, reward: { xp: 80, coins: 40 } },
  { day: 5, claimed: false, reward: { xp: 100, coins: 50, item: 'Mystery Box' } },
  { day: 6, claimed: false, reward: { xp: 120, coins: 60 } },
  { day: 7, claimed: false, reward: { xp: 200, coins: 100, item: 'Premium Border' } },
];

// ==================== MAIN COMPONENT ====================

export default function ProgressionCustomization() {
  const { level, xp, karma: _karma } = useGamificationStore();
  void _karma; // Reserved for future use
  const [activeCategory, setActiveCategory] = useState<ProgressionCategory>('achievements');
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'friends' | 'weekly'>('global');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'achievements' as ProgressionCategory,
      label: 'Achievements',
      icon: TrophyIcon,
      count: MOCK_ACHIEVEMENTS.length,
    },
    {
      id: 'leaderboards' as ProgressionCategory,
      label: 'Leaderboards',
      icon: ChartBarIcon,
      count: MOCK_LEADERBOARD.length,
    },
    {
      id: 'quests' as ProgressionCategory,
      label: 'Quests',
      icon: SparklesIcon,
      count: MOCK_QUESTS.filter((q) => !q.completed).length,
    },
    { id: 'rewards' as ProgressionCategory, label: 'Daily Rewards', icon: GiftIcon, count: 7 },
  ];

  // Calculate current streak
  const currentStreak = MOCK_DAILY_REWARDS.filter((r) => r.claimed).length;

  // Handle claiming daily reward
  const handleClaimReward = (day: number) => {
    // TODO: Implement API call to claim daily reward
    console.log(`Claiming reward for day ${day}`);
    // In production, this would:
    // 1. Call API to claim the reward
    // 2. Update local state to mark the reward as claimed
    // 3. Show a success toast
    // For now, just log the claim
  };

  // Filter achievements by search
  const filteredAchievements = MOCK_ACHIEVEMENTS.filter(
    (ach) =>
      ach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ach.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard variant="holographic" className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-500">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Level</p>
              <p className="text-2xl font-bold text-white">{level}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="holographic" className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <BoltIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Total XP</p>
              <p className="text-2xl font-bold text-white">{xp.toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="holographic" className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <FireIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Streak</p>
              <p className="text-2xl font-bold text-white">{currentStreak} days</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {category.label}
              {category.id !== 'rewards' && (
                <span className="text-xs opacity-60">({category.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar (for achievements only) */}
      {activeCategory === 'achievements' && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search achievements..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeCategory === 'achievements' && (
            <AchievementsSection achievements={filteredAchievements} />
          )}

          {activeCategory === 'leaderboards' && (
            <LeaderboardsSection
              entries={MOCK_LEADERBOARD}
              leaderboardType={leaderboardType}
              onTypeChange={setLeaderboardType}
            />
          )}

          {activeCategory === 'quests' && <QuestsSection quests={MOCK_QUESTS} />}

          {activeCategory === 'rewards' && (
            <DailyRewardsSection
              rewards={MOCK_DAILY_REWARDS}
              currentStreak={currentStreak}
              onClaim={handleClaimReward}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ==================== SECTION COMPONENTS ====================

interface AchievementsSectionProps {
  achievements: Achievement[];
}

function AchievementsSection({ achievements }: AchievementsSectionProps) {
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
                    transition={{ duration: 1, delay: index * 0.05 }}
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

interface LeaderboardsSectionProps {
  entries: LeaderboardEntry[];
  leaderboardType: 'global' | 'friends' | 'weekly';
  onTypeChange: (type: 'global' | 'friends' | 'weekly') => void;
}

function LeaderboardsSection({ entries, leaderboardType, onTypeChange }: LeaderboardsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Leaderboard Type Selector */}
      <div className="flex gap-2">
        {['global', 'friends', 'weekly'].map((type) => (
          <button
            key={type}
            onClick={() => onTypeChange(type as typeof leaderboardType)}
            className={`rounded-lg px-4 py-2 font-medium transition-all ${
              leaderboardType === type
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard
              variant={entry.isCurrentUser ? 'neon' : 'crystal'}
              glow={entry.isCurrentUser}
              className={`p-4 ${entry.isCurrentUser ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                    entry.rank === 1
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                      : entry.rank === 2
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                        : entry.rank === 3
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                          : 'bg-dark-700 text-white/60'
                  }`}
                >
                  #{entry.rank}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {entry.displayName}
                    {entry.isCurrentUser && (
                      <span className="ml-2 rounded-full bg-primary-600 px-2 py-0.5 text-xs">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-white/60">@{entry.username}</p>
                </div>

                {/* Level & XP */}
                <div className="text-right">
                  <p className="text-lg font-bold text-white">Level {entry.level}</p>
                  <p className="text-sm text-white/60">{entry.xp.toLocaleString()} XP</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface QuestsSectionProps {
  quests: Quest[];
}

function QuestsSection({ quests }: QuestsSectionProps) {
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

interface DailyRewardsSectionProps {
  rewards: DailyReward[];
  currentStreak: number;
  onClaim: (day: number) => void;
}

function DailyRewardsSection({ rewards, currentStreak, onClaim }: DailyRewardsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Streak Display */}
      <GlassCard variant="holographic" className="p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-3">
          <FireIcon className="h-12 w-12 text-orange-500" />
          <div>
            <p className="text-4xl font-bold text-white">{currentStreak}</p>
            <p className="text-sm text-white/60">Day Streak</p>
          </div>
        </div>
        <p className="text-sm text-white/60">Keep logging in daily to maintain your streak!</p>
      </GlassCard>

      {/* Reward Calendar */}
      <div className="grid grid-cols-7 gap-3">
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.day}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard
              variant={
                reward.claimed
                  ? 'neon'
                  : reward.day === currentStreak + 1
                    ? 'holographic'
                    : 'crystal'
              }
              glow={reward.day === currentStreak + 1}
              className={`relative p-4 text-center ${reward.claimed ? 'opacity-70' : ''}`}
            >
              {/* Day Number */}
              <div className="mb-2 text-2xl font-bold text-white">Day {reward.day}</div>

              {/* Reward Icon */}
              <div className="mb-2 text-3xl">
                {reward.reward.item ? '🎁' : reward.day === 7 ? '💎' : '🪙'}
              </div>

              {/* Rewards */}
              <div className="space-y-1 text-xs">
                {reward.reward.xp && (
                  <p className="font-medium text-yellow-400">+{reward.reward.xp} XP</p>
                )}
                {reward.reward.coins && (
                  <p className="font-medium text-blue-400">+{reward.reward.coins} Coins</p>
                )}
                {reward.reward.item && (
                  <p className="font-medium text-purple-400">{reward.reward.item}</p>
                )}
              </div>

              {/* Status */}
              {reward.claimed ? (
                <div className="mt-2">
                  <CheckCircleIconSolid className="mx-auto h-5 w-5 text-green-400" />
                </div>
              ) : reward.day === currentStreak + 1 ? (
                <button
                  onClick={() => onClaim(reward.day)}
                  className="mt-2 w-full rounded bg-primary-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Claim
                </button>
              ) : (
                <div className="mt-2 text-xs text-white/40">
                  {reward.day < currentStreak + 1 ? 'Missed' : 'Locked'}
                </div>
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
