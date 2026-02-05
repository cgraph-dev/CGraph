/**
 * Leaderboard sections and UI components
 * @module pages/leaderboard
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrophyIcon,
  GlobeAltIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BoltIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

import { GlassCard, AnimatedAvatar } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

import type {
  LeaderboardEntry,
  LeaderboardData,
  LeaderboardCategory,
  TimePeriod,
  CategoryConfig,
} from './types';
import { CATEGORIES, TIME_PERIODS, PAGE_SIZE } from './constants';
import { formatValue, getRankChange, getRankConfig } from './utils';

interface HeaderProps {
  className?: string;
}

export function LeaderboardHeader({ className = '' }: HeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 text-center ${className}`}
    >
      {/* Trophy Badge */}
      <motion.div
        className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 px-6 py-3 backdrop-blur-sm"
        whileHover={{ scale: 1.02 }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(250, 204, 21, 0.2)',
            '0 0 40px rgba(250, 204, 21, 0.3)',
            '0 0 20px rgba(250, 204, 21, 0.2)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrophyIcon className="h-7 w-7 text-yellow-400" />
        </motion.div>
        <span className="text-lg font-bold text-yellow-400">Global Rankings</span>
        <motion.span
          className="text-2xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🏆
        </motion.span>
      </motion.div>

      <h1 className="mb-4 text-4xl font-black sm:text-5xl md:text-6xl">
        <span className="bg-gradient-to-r from-white via-yellow-200 to-orange-300 bg-clip-text text-transparent">
          Leaderboard
        </span>
      </h1>
      <p className="mx-auto max-w-xl text-lg text-gray-400">
        Compete with the community, earn achievements, and climb to the top
      </p>
    </motion.div>
  );
}

interface CategoryTabsProps {
  category: LeaderboardCategory;
  onCategoryChange: (category: LeaderboardCategory) => void;
}

export function CategoryTabs({ category, onCategoryChange }: CategoryTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="scrollbar-hide mb-6 overflow-x-auto pb-2"
    >
      <div className="flex min-w-max justify-center gap-2 px-4">
        {CATEGORIES.map((cat, index) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => {
              onCategoryChange(cat.id);
              HapticFeedback.light();
            }}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              category === cat.id
                ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                : 'border border-dark-700 bg-dark-800/80 text-gray-400 hover:bg-dark-700 hover:text-white'
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={category === cat.id ? 'text-white' : cat.color}>{cat.icon}</span>
            <span>{cat.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

interface FiltersRowProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  currentCategory: CategoryConfig;
}

export function FiltersRow({
  timePeriod,
  onTimePeriodChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  isRefreshing,
  currentCategory,
}: FiltersRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
    >
      {/* Time Period Tabs */}
      <div className="flex items-center gap-1 rounded-2xl border border-dark-700 bg-dark-800/80 p-1.5 backdrop-blur-sm">
        {TIME_PERIODS.map((period) => (
          <motion.button
            key={period.id}
            onClick={() => {
              onTimePeriodChange(period.id);
              HapticFeedback.light();
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              timePeriod === period.id
                ? `bg-gradient-to-r ${currentCategory.gradient} text-white shadow-md`
                : 'text-gray-400 hover:bg-dark-700/50 hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {period.icon}
            <span className="hidden sm:inline">{period.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Search & Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-48 rounded-xl border border-dark-700 bg-dark-800/80 py-2 pl-9 pr-4 text-white placeholder-gray-500 transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 sm:w-64"
          />
        </div>
        <motion.button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-xl border border-dark-700 bg-dark-800/80 p-2.5 text-gray-400 transition-all hover:bg-dark-700 hover:text-white disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
    </motion.div>
  );
}

interface UserRankCardProps {
  userRank: LeaderboardEntry;
  currentCategory: CategoryConfig;
}

export function UserRankCard({ userRank, currentCategory }: UserRankCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <GlassCard variant="neon" glow className="relative overflow-hidden p-5">
        {/* Animated background */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${currentCategory.gradient} opacity-5`}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />

        <div className="relative flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-primary-500/30 bg-primary-500/20 px-4 py-2 text-center">
              <p className="mb-0.5 text-xs text-primary-300">Your Rank</p>
              <p className="text-3xl font-black text-primary-400">#{userRank.rank}</p>
            </div>
            <div className="hidden h-14 w-px bg-gradient-to-b from-transparent via-dark-600 to-transparent sm:block" />
            <div className="flex items-center gap-3">
              <AnimatedAvatar
                src={userRank.avatarUrl}
                alt={userRank.displayName || userRank.username}
                size="lg"
                showStatus={true}
                statusType="online"
              />
              <div>
                <p className="text-lg font-bold text-white">
                  {userRank.displayName || userRank.username}
                </p>
                <p className="text-sm text-gray-400">@{userRank.username}</p>
                {userRank.title && (
                  <span className="text-xs font-medium text-primary-400">{userRank.title}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {getRankChange(userRank.rank, userRank.previousRank)}
            <div className="text-center sm:text-right">
              <p className="mb-1 text-xs text-gray-400">{currentCategory.description}</p>
              <p
                className={`bg-gradient-to-r text-2xl font-black ${currentCategory.gradient} bg-clip-text text-transparent`}
              >
                {formatValue(userRank.value)}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

interface LeaderboardTableHeaderProps {
  totalCount: number;
  lastUpdated: string;
}

export function LeaderboardTableHeader({ totalCount, lastUpdated }: LeaderboardTableHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-between border-b border-dark-700/50 bg-dark-900/50 p-4 sm:flex-row">
      <div className="mb-2 flex items-center gap-3 text-gray-400 sm:mb-0">
        <GlobeAltIcon className="h-5 w-5" />
        <span className="text-sm font-medium">
          {totalCount.toLocaleString()} participants competing
        </span>
      </div>
      <div className="flex items-center gap-2 text-gray-500">
        <ClockIcon className="h-4 w-4" />
        <span className="text-xs">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  currentCategory: CategoryConfig;
}

export function LoadingState({ currentCategory }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <motion.div
        className={`h-16 w-16 rounded-full border-4 border-t-transparent bg-gradient-to-r ${currentCategory.gradient}`}
        style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <p className="mt-4 text-gray-400">Loading rankings...</p>
    </div>
  );
}

interface PodiumProps {
  entries: LeaderboardEntry[];
}

export function TopPodium({ entries }: PodiumProps) {
  const navigate = useNavigate();

  if (entries.length < 3) return null;

  return (
    <div className="relative border-b border-dark-700/50 bg-gradient-to-b from-dark-800/50 to-transparent px-4 py-8">
      {/* Spotlights */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
      </div>

      <div className="relative flex items-end justify-center gap-4 sm:gap-8">
        {[1, 0, 2].map((index) => {
          const entry = entries[index];
          if (!entry) return null;
          const config = getRankConfig(entry.rank);
          const isFirst = entry.rank === 1;
          const podiumHeight = isFirst ? 'h-36' : entry.rank === 2 ? 'h-28' : 'h-20';

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.3 + index * 0.15,
                type: 'spring',
                stiffness: 100,
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => navigate(`/profile/${entry.userId}`)}
              className={`flex cursor-pointer flex-col items-center text-center ${
                isFirst ? 'order-2' : index === 0 ? 'order-1' : 'order-3'
              }`}
            >
              {/* Avatar Section */}
              <div className="relative mb-2">
                {/* Crown for #1 */}
                {config.crown && (
                  <motion.div
                    className="absolute -top-8 left-1/2 z-10 -translate-x-1/2"
                    animate={{
                      y: [0, -5, 0],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-3xl drop-shadow-lg">👑</span>
                  </motion.div>
                )}

                {/* Glow Effect */}
                <motion.div
                  className={`absolute inset-0 rounded-full blur-xl ${config.bg}`}
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ boxShadow: `0 0 40px ${config.glowColor}` }}
                />

                <div
                  className={`relative rounded-full p-1 ${config.bg} border-2 ${config.border}`}
                  style={{ boxShadow: `0 0 30px ${config.glowColor}` }}
                >
                  <AnimatedAvatar
                    src={entry.avatarUrl}
                    alt={entry.displayName || entry.username}
                    size={isFirst ? '2xl' : 'xl'}
                    showStatus={entry.isOnline}
                    statusType={entry.isOnline ? 'online' : 'offline'}
                  />
                </div>

                {/* Medal Badge */}
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-2xl drop-shadow-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {config.medal}
                </motion.div>
              </div>

              {/* User Info */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <p className={`max-w-[80px] truncate font-bold sm:max-w-[120px] ${config.text}`}>
                    {entry.displayName || entry.username}
                  </p>
                  {entry.isPremium && <BoltIcon className="h-4 w-4 text-yellow-400" />}
                  {entry.isVerified && <StarIcon className="h-4 w-4 text-primary-400" />}
                </div>
                {entry.title && (
                  <p className="mb-1 text-xs font-medium text-primary-400">{entry.title}</p>
                )}
                <p className="text-xs text-gray-500">Level {entry.level}</p>
                <p className={`text-lg font-black ${config.text} mt-1`}>
                  {formatValue(entry.value)}
                </p>
              </div>

              {/* Podium */}
              <motion.div
                className={`${podiumHeight} mt-3 w-20 rounded-t-lg sm:w-28 ${config.bg} border-x-2 border-t-2 ${config.border} flex items-start justify-center pt-2`}
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              >
                <span className={`text-3xl font-black ${config.text}`}>#{entry.rank}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface RankingsListProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  currentCategory: CategoryConfig;
  page: number;
}

export function RankingsList({ entries, currentUserId, currentCategory, page }: RankingsListProps) {
  const navigate = useNavigate();
  const displayEntries = page === 1 ? entries.slice(3) : entries;

  return (
    <div className="divide-y divide-dark-800/50">
      <AnimatePresence mode="popLayout">
        {displayEntries.map((entry, index) => {
          const isCurrentUser = currentUserId === entry.userId;
          const config = getRankConfig(entry.rank);

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => navigate(`/profile/${entry.userId}`)}
              className={`group flex cursor-pointer items-center gap-3 p-4 transition-all hover:bg-dark-800/50 sm:gap-4 ${
                isCurrentUser
                  ? `border-l-4 border-primary-500 bg-gradient-to-r from-primary-500/10 to-transparent`
                  : ''
              }`}
            >
              {/* Rank */}
              <div className="w-10 shrink-0 text-center sm:w-14">
                <span
                  className={`text-base font-bold sm:text-lg ${entry.rank <= 3 ? config.text : 'text-gray-400'}`}
                >
                  #{entry.rank}
                </span>
              </div>

              {/* Rank Change */}
              <div className="w-14 shrink-0 sm:w-16">
                {getRankChange(entry.rank, entry.previousRank)}
              </div>

              {/* Avatar */}
              <div className="shrink-0">
                <AnimatedAvatar
                  src={entry.avatarUrl}
                  alt={entry.displayName || entry.username}
                  size="md"
                  showStatus={entry.isOnline}
                  statusType={entry.isOnline ? 'online' : 'offline'}
                />
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`truncate font-semibold ${isCurrentUser ? 'text-primary-400' : 'text-white transition-colors group-hover:text-primary-300'}`}
                  >
                    {entry.displayName || entry.username}
                  </span>
                  {entry.isPremium && <BoltIcon className="h-4 w-4 shrink-0 text-yellow-400" />}
                  {entry.isVerified && <StarIcon className="h-4 w-4 shrink-0 text-primary-400" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Level {entry.level}</span>
                  {entry.title && (
                    <>
                      <span>•</span>
                      <span className="text-primary-400/70">{entry.title}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Value */}
              <div className="shrink-0 text-right">
                <p
                  className={`bg-gradient-to-r text-base font-bold sm:text-lg ${currentCategory.gradient} bg-clip-text text-transparent`}
                >
                  {formatValue(entry.value)}
                </p>
                <p className="hidden text-xs text-gray-500 sm:block">
                  {currentCategory.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty State */}
      {displayEntries.length === 0 && (
        <div className="py-16 text-center">
          <MagnifyingGlassIcon className="mx-auto mb-4 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">No users found</p>
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentCategory: CategoryConfig;
}

export function Pagination({ page, totalPages, onPageChange, currentCategory }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 border-t border-dark-700/50 bg-dark-900/30 p-4">
      <motion.button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className="rounded-lg bg-dark-700/50 p-2 text-gray-400 transition-all hover:bg-dark-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        <ChevronLeftIcon className="-ml-3 h-4 w-4" />
      </motion.button>
      <motion.button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-lg bg-dark-700/50 p-2 text-gray-400 transition-all hover:bg-dark-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </motion.button>

      <div className="flex items-center gap-1 px-2">
        {[...Array(Math.min(5, totalPages))].map((_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          return (
            <motion.button
              key={i}
              onClick={() => onPageChange(pageNum)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                page === pageNum
                  ? `bg-gradient-to-r ${currentCategory.gradient} text-white`
                  : 'bg-dark-700/50 text-gray-400 hover:bg-dark-600 hover:text-white'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {pageNum}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg bg-dark-700/50 p-2 text-gray-400 transition-all hover:bg-dark-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </motion.button>
      <motion.button
        onClick={() => onPageChange(totalPages)}
        disabled={page >= totalPages}
        className="rounded-lg bg-dark-700/50 p-2 text-gray-400 transition-all hover:bg-dark-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRightIcon className="h-4 w-4" />
        <ChevronRightIcon className="-ml-3 h-4 w-4" />
      </motion.button>

      <span className="ml-2 hidden text-sm text-gray-500 sm:inline">
        of {totalPages.toLocaleString()} pages
      </span>
    </div>
  );
}
