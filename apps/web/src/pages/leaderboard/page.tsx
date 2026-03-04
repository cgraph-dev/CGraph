/**
 * Leaderboard Page - Main component
 * @module pages/leaderboard
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { UserGroupIcon, ChartBarIcon, ClockIcon, BoltIcon, GlobeAltIcon, UserCircleIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';

import { GlassCard } from '@/shared/components/ui';
import { useAuthStore } from '@/modules/auth/store';
import { api } from '@/lib/api';

import type { LeaderboardData, LeaderboardCategory, TimePeriod } from './types';
import { CATEGORIES, PAGE_SIZE } from './constants';
import { FloatingParticles, ConfettiDisplay } from './effects';
import { generateMockData } from './utils';
import {
  LeaderboardHeader,
  CategoryTabs,
  FiltersRow,
  UserRankCard,
  LeaderboardTableHeader,
  LoadingState,
  TopPodium,
  RankingsList,
  Pagination,
} from './sections';

/** Scope for leaderboard: global, group, or board */
export type LeaderboardScope = 'global' | 'group' | 'board';

const SCOPE_OPTIONS: { id: LeaderboardScope; label: string; icon: React.ReactNode }[] = [
  { id: 'global', label: 'Global', icon: <GlobeAltIcon className="h-4 w-4" /> },
  { id: 'group', label: 'This Group', icon: <UserCircleIcon className="h-4 w-4" /> },
  { id: 'board', label: 'This Board', icon: <ViewColumnsIcon className="h-4 w-4" /> },
];

/**
 * Leaderboard Page — route-level page component.
 */
export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState<LeaderboardCategory>('xp');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [scopeId, setScopeId] = useState<string | undefined>(undefined);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(
    () => () => {
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    },
    []
  );

  const currentCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0]!,
    [category]
  );

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params: Record<string, string | number> = {
          category,
          period: timePeriod,
          page,
          page_size: PAGE_SIZE,
          scope,
        };
        if (scopeId) params.scope_id = scopeId;

        const response = await api.get('/api/v1/leaderboard', { params });

        setLeaderboard(response.data);
        if (page === 1) {
          setShowConfetti(true);
          confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 5000);
        }
      } catch {
        // Mock data for demo
         
        setLeaderboard(generateMockData(page, user as Parameters<typeof generateMockData>[1])); // safe downcast – structural boundary
        if (page === 1) {
          setShowConfetti(true);
          confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 5000);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [category, timePeriod, page, user, scope, scopeId]
  );

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Filter entries by search
  const filteredEntries = useMemo(() => {
    const entries = leaderboard?.entries ?? [];
    if (!leaderboard || !searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.username.toLowerCase().includes(query) ||
        entry.displayName?.toLowerCase().includes(query)
    );
  }, [leaderboard, searchQuery]);

  const totalPages = leaderboard?.totalCount ? Math.ceil(leaderboard.totalCount / PAGE_SIZE) : 0;

  const handleCategoryChange = (newCategory: LeaderboardCategory) => {
    setCategory(newCategory);
    setPage(1);
  };

  const handleTimePeriodChange = (newPeriod: TimePeriod) => {
    setTimePeriod(newPeriod);
    setPage(1);
  };

  const handleScopeChange = (newScope: LeaderboardScope) => {
    setScope(newScope);
    if (newScope === 'global') setScopeId(undefined);
    setPage(1);
  };

  return (
    <div className="relative flex h-full max-h-screen flex-1 flex-col overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Background Effects */}
      <FloatingParticles />
      <ConfettiDisplay show={showConfetti} page={page} />

      <div className="flex-1 overflow-y-auto">
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <LeaderboardHeader />

          {/* Scope Selector Tabs */}
          <div className="mb-4 flex items-center gap-2">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleScopeChange(opt.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  scope === opt.id
                    ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30'
                    : 'text-gray-400 hover:bg-dark-700/50 hover:text-white'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <CategoryTabs category={category} onCategoryChange={handleCategoryChange} />

          <FiltersRow
            timePeriod={timePeriod}
            onTimePeriodChange={handleTimePeriodChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={() => fetchLeaderboard(true)}
            isRefreshing={isRefreshing}
            currentCategory={currentCategory}
          />

          {/* Current User's Rank Card (if not in top) */}
          {leaderboard?.userRank && leaderboard.userRank.rank > PAGE_SIZE && (
            <UserRankCard userRank={leaderboard.userRank} currentCategory={currentCategory} />
          )}

          {/* Main Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <GlassCard variant="frosted" className="overflow-hidden">
              <LeaderboardTableHeader
                totalCount={leaderboard?.totalCount ?? 0}
                lastUpdated={leaderboard?.lastUpdated ?? new Date().toISOString()}
              />

              {isLoading ? (
                <LoadingState currentCategory={currentCategory} />
              ) : (
                <>
                  {page === 1 && leaderboard && (leaderboard.entries?.length ?? 0) >= 3 && (
                    <TopPodium entries={leaderboard.entries} />
                  )}

                  <RankingsList
                    entries={filteredEntries}
                    currentUserId={user?.id}
                    currentCategory={currentCategory}
                    page={page}
                  />

                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    currentCategory={currentCategory}
                  />
                </>
              )}
            </GlassCard>
          </motion.div>

          {/* Stats Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              {
                label: 'Total Users',
                value: (leaderboard?.totalCount ?? 0).toLocaleString(),
                icon: <UserGroupIcon className="h-5 w-5" />,
              },
              {
                label: 'Active Today',
                value: Math.floor((leaderboard?.totalCount ?? 0) * 0.15).toLocaleString(),
                icon: <BoltIcon className="h-5 w-5" />,
              },
              {
                label: 'Your Percentile',
                value: leaderboard?.userRank
                  ? `Top ${Math.ceil((leaderboard.userRank.rank / (leaderboard?.totalCount || 1)) * 100)}%`
                  : 'N/A',
                icon: <ChartBarIcon className="h-5 w-5" />,
              },
              { label: 'Next Update', value: '5 min', icon: <ClockIcon className="h-5 w-5" /> },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-center"
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${currentCategory.gradient} mb-2 bg-opacity-20`}
                >
                  <span className={currentCategory.color}>{stat.icon}</span>
                </div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
