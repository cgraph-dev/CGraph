/**
 * ForumUserLeaderboard — Full-page user leaderboard for a specific forum.
 *
 * Shows:
 * - Period selector tabs (All Time | Monthly | Weekly | Daily)
 * - Podium section for top 3
 * - Ranked list with position, avatar, name, score, rank badge, change indicator
 * - "My Rank" card with progress bar to next rank
 * - Sidebar: rank definitions with images and score thresholds
 *
 * Route: /forums/:forumId/user-leaderboard
 *
 * @module pages/forums/forum-user-leaderboard
 */

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';

import { useForumLeaderboardStore } from '@/modules/forums/store/forumStore.leaderboard';
import { LeaderboardPodium } from '@/modules/forums/components/leaderboard-widget/leaderboard-podium';
import { RankBadge } from '@/modules/forums/components/leaderboard-widget/rank-badge';
import type {
  LeaderboardPeriod,
  LeaderboardEntry,
  ForumRank,
} from '@cgraph/shared-types';
import { LEADERBOARD_PERIOD_LABELS } from '@cgraph/shared-types';

// ── Period Tab Bar ─────────────────────────────────────────────────────

function PeriodTabs({
  current,
  onChange,
}: {
  current: LeaderboardPeriod;
  onChange: (p: LeaderboardPeriod) => void;
}) {
  const periods: LeaderboardPeriod[] = ['all_time', 'monthly', 'weekly', 'daily'];

  return (
    <div className="flex gap-1 rounded-lg bg-dark-800 p-1">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
            current === p
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
          }`}
        >
          {LEADERBOARD_PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

// ── Change Indicator ───────────────────────────────────────────────────

function ChangeIndicator({ direction, amount }: { direction: string; amount: number }) {
  if (direction === 'up') {
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-green-400">
        <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
        {amount > 0 && amount}
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-red-400">
        <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
        {amount > 0 && amount}
      </span>
    );
  }
  return (
    <span className="text-xs text-gray-600">
      <MinusIcon className="h-3.5 w-3.5" />
    </span>
  );
}

// ── Leaderboard Row ────────────────────────────────────────────────────

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 rounded-lg bg-dark-800/60 px-4 py-3 transition-colors hover:bg-dark-700/60"
    >
      {/* Position */}
      <span className="w-8 text-center text-sm font-bold text-gray-400">
        #{entry.position}
      </span>

      {/* Avatar */}
      {entry.user.avatarUrl ? (
        <img
          src={entry.user.avatarUrl}
          alt={entry.user.username}
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dark-600">
          <span className="text-sm font-bold text-gray-400">
            {entry.user.username?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
      )}

      {/* Name + rank badge */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-white">
            {entry.user.displayName || entry.user.username}
          </span>
          {entry.rank && (
            <RankBadge
              rankName={entry.rank.name}
              rankImage={entry.rank.imageUrl}
              rankColor={entry.rank.color}
              rank={entry.rank}
              size="sm"
            />
          )}
        </div>
        <span className="text-xs text-gray-500">Lvl {entry.user.level}</span>
      </div>

      {/* Score */}
      <span className="text-sm font-semibold text-white">
        {Math.round(entry.score).toLocaleString()}
      </span>

      {/* Change */}
      <ChangeIndicator direction={entry.change.direction} amount={entry.change.amount} />
    </motion.div>
  );
}

// ── My Rank Card ───────────────────────────────────────────────────────

function MyRankCard() {
  const { myRank } = useForumLeaderboardStore();

  if (!myRank) return null;

  const { progress } = myRank;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary-500/20 bg-gradient-to-r from-primary-500/10 to-purple-500/10 p-4"
    >
      <h3 className="mb-2 text-sm font-semibold text-primary-400">Your Rank</h3>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-white">#{myRank.position}</span>
          {myRank.rank && (
            <div className="mt-1">
              <RankBadge
                rankName={myRank.rank.name}
                rankImage={myRank.rank.imageUrl}
                rankColor={myRank.rank.color}
                rank={myRank.rank}
                size="md"
              />
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="text-lg font-semibold text-white">
            {Math.round(myRank.score).toLocaleString()} pts
          </span>
          <p className="text-xs text-gray-400">
            Karma: {myRank.forumKarma} · XP: {myRank.xp}
          </p>
        </div>
      </div>

      {/* Progress bar to next rank */}
      {progress.nextRank && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span style={{ color: progress.currentRank.color }}>
              {progress.currentRank.name}
            </span>
            <span style={{ color: progress.nextRank.color }}>
              {progress.nextRank.name}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-dark-600">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${progress.currentRank.color}, ${progress.nextRank.color})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress.progressPercent}%` }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            />
          </div>
          <p className="mt-1 text-center text-[11px] text-gray-500">
            {progress.scoreToNextRank != null
              ? `${progress.scoreToNextRank} pts to ${progress.nextRank.name}`
              : 'Max rank achieved!'}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Rank Definitions Sidebar ───────────────────────────────────────────

function RanksSidebar({ ranks }: { ranks: ForumRank[] }) {
  if (ranks.length === 0) return null;

  return (
    <div className="rounded-xl bg-dark-800/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-300">Rank Tiers</h3>
      <div className="space-y-2">
        {ranks.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <RankBadge
              rankName={r.name}
              rankImage={r.imageUrl}
              rankColor={r.color}
              rank={r}
              size="md"
            />
            <span className="text-xs text-gray-500">
              {r.minScore}{r.maxScore != null ? `–${r.maxScore}` : '+'} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function ForumUserLeaderboard() {
  const { forumId } = useParams<{ forumId: string }>();
  const {
    entries,
    period,
    ranks,
    isLoading,
    fetchLeaderboard,
    fetchMyRank,
    fetchRanks,
    setPeriod,
  } = useForumLeaderboardStore();

  useEffect(() => {
    if (!forumId) return;
    fetchLeaderboard(forumId, period);
    fetchMyRank(forumId);
    fetchRanks(forumId);
  }, [forumId, period]);

  const topThree = entries.slice(0, 3);
  const restOfList = entries.slice(3);

  const handlePeriodChange = (p: LeaderboardPeriod) => {
    setPeriod(p);
  };

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      {/* Main content */}
      <div className="relative z-10 flex flex-1 gap-6 overflow-y-auto p-6">
        {/* Left — Leaderboard */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.bouncy}
          >
            <TrophyIconSolid className="h-7 w-7 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          </motion.div>

          {/* Period tabs */}
          <PeriodTabs current={period} onChange={handlePeriodChange} />

          {/* Podium */}
          {topThree.length > 0 && <LeaderboardPodium entries={topThree} />}

          {/* Ranked list */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {isLoading && entries.length === 0 ? (
                <div className="space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-dark-700/50" />
                  ))}
                </div>
              ) : (
                restOfList.map((entry) => (
                  <LeaderboardRow key={entry.user.id} entry={entry} />
                ))
              )}
            </AnimatePresence>

            {entries.length === 0 && !isLoading && (
              <p className="py-12 text-center text-gray-500">
                No leaderboard entries yet. Be the first contributor!
              </p>
            )}
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="hidden w-64 shrink-0 space-y-4 lg:block">
          <MyRankCard />
          <RanksSidebar ranks={ranks} />
        </div>
      </div>
    </div>
  );
}
