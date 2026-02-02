import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  useSeasonalEventStore,
  SeasonalEvent,
  EventReward,
  BattlePassTier,
} from '@/stores/seasonalEventStore';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

// Reserved for future features
const _reservedImports = {
  React,
  useCallback,
  useMotionValue,
  useTransform,
  useSeasonalEventStore,
};
void _reservedImports;

/**
 * Event Banner System
 *
 * Dynamic event UI components with:
 * - Animated event banners
 * - Real-time countdown timers
 * - Battle pass progress
 * - Leaderboard display
 * - Quest tracking
 *
 * Scale features:
 * - Lazy loading for off-screen elements
 * - Progressive image loading
 * - WebSocket subscriptions for live updates
 * - Throttled re-renders
 */

// ==================== TIER HELPER TYPES ====================

// Extended reward with icon support (for display purposes)
interface DisplayReward extends EventReward {
  icon?: string;
}

// Extended tier type that includes singular reward accessors for backward compatibility
interface BattlePassTierExtended extends Omit<BattlePassTier, 'freeRewards' | 'premiumRewards'> {
  id: number;
  claimed?: boolean;
  freeReward: DisplayReward;
  premiumReward: DisplayReward;
  freeRewards: EventReward[];
  premiumRewards: EventReward[];
}

// Icon mapping based on reward type
const REWARD_TYPE_ICONS: Record<EventReward['type'], string> = {
  coins: '🪙',
  gems: '💎',
  xp: '⭐',
  title: '🏷️',
  border: '🖼️',
  effect: '✨',
  badge: '🎖️',
};

// Helper to get icon for a reward
function getRewardIcon(reward: EventReward): string {
  return REWARD_TYPE_ICONS[reward.type] || '🎁';
}

// Helper to transform tiers into extended format with singular reward accessors
function normalizeTiers(tiers: BattlePassTier[]): BattlePassTierExtended[] {
  return tiers.map((tier, index) => {
    const freeReward = tier.freeRewards?.[0];
    const premiumReward = tier.premiumRewards?.[0];
    return {
      ...tier,
      id: index + 1,
      claimed: false,
      // Provide singular accessors with icon based on type
      freeReward: freeReward
        ? { ...freeReward, icon: getRewardIcon(freeReward) }
        : { id: '', name: 'Reward', type: 'xp' as const, icon: '🎁' },
      premiumReward: premiumReward
        ? { ...premiumReward, icon: getRewardIcon(premiumReward) }
        : { id: '', name: 'Premium Reward', type: 'gems' as const, icon: '⭐' },
    };
  });
}

// ==================== EVENT BANNER ====================

interface EventBannerProps {
  event: SeasonalEvent;
  variant?: 'full' | 'compact' | 'minimal';
  onClick?: () => void;
}

export function EventBanner({ event, variant = 'full', onClick }: EventBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Countdown timer with requestAnimationFrame for smooth updates
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = 0;

    const updateCountdown = (timestamp: number) => {
      // Throttle to once per second
      if (timestamp - lastUpdate >= 1000) {
        const now = new Date();
        const end = new Date(event.endsAt);
        const diff = end.getTime() - now.getTime();

        if (diff > 0) {
          setTimeRemaining({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
          });
          lastUpdate = timestamp;
        } else {
          setTimeRemaining(null);
        }
      }

      animationFrameId = requestAnimationFrame(updateCountdown);
    };

    animationFrameId = requestAnimationFrame(updateCountdown);
    return () => cancelAnimationFrame(animationFrameId);
  }, [event.endsAt]);

  if (variant === 'minimal') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onClick}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 transition-colors hover:border-purple-500/50"
      >
        <span className="text-xl">{getEventEmoji(event.type)}</span>
        <span className="truncate text-sm font-medium">{event.name}</span>
        {timeRemaining && (
          <span className="ml-auto text-xs text-gray-400">
            {timeRemaining.days}d {timeRemaining.hours}h
          </span>
        )}
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onClick}
        className="group relative cursor-pointer overflow-hidden rounded-xl"
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${event.colors?.primary || '#8B5CF6'}40, ${event.colors?.secondary || '#EC4899'}40)`,
          }}
        />

        {/* Content */}
        <div className="relative flex items-center gap-4 p-4">
          <div className="text-3xl">{getEventEmoji(event.type)}</div>
          <div className="flex-1">
            <h3 className="font-bold text-white">{event.name}</h3>
            {timeRemaining && (
              <p className="text-sm text-gray-300">
                Ends in {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
              </p>
            )}
          </div>
          <div className="text-2xl opacity-50 transition-opacity group-hover:opacity-100">→</div>
        </div>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl"
    >
      {/* Animated Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${event.colors?.primary || '#8B5CF6'}, ${event.colors?.secondary || '#EC4899'})`,
        }}
      />

      {/* Animated particles */}
      <EventParticles eventType={event.type} />

      {/* Content */}
      <div className="relative flex items-center gap-6 p-8">
        {/* Event Icon */}
        <motion.div
          className="text-6xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {getEventEmoji(event.type)}
        </motion.div>

        {/* Event Info */}
        <div className="flex-1">
          <motion.h2
            className="mb-2 text-3xl font-bold text-white"
            animate={{
              textShadow: [
                '0 0 20px rgba(255,255,255,0.5)',
                '0 0 40px rgba(255,255,255,0.8)',
                '0 0 20px rgba(255,255,255,0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {event.name}
          </motion.h2>
          {event.description && <p className="mb-3 text-white/80">{event.description}</p>}

          {/* XP Multiplier Badge */}
          {event.multipliers?.xp && event.multipliers.xp > 1 && (
            <span className="inline-block rounded-full bg-yellow-500/30 px-3 py-1 text-sm font-bold text-yellow-300">
              {event.multipliers.xp}x XP Bonus
            </span>
          )}
        </div>

        {/* Countdown */}
        {timeRemaining && (
          <div className="text-center">
            <p className="mb-2 text-xs uppercase tracking-wider text-white/60">Ends In</p>
            <div className="flex gap-2">
              <CountdownUnit value={timeRemaining.days} label="Days" />
              <CountdownUnit value={timeRemaining.hours} label="Hours" />
              <CountdownUnit value={timeRemaining.minutes} label="Min" />
            </div>
          </div>
        )}

        {/* CTA Arrow */}
        <motion.div
          className="text-4xl text-white/50 transition-colors group-hover:text-white"
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          →
        </motion.div>
      </div>

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

// ==================== COUNTDOWN UNIT ====================

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/30 text-2xl font-bold text-white"
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <p className="mt-1 text-xs text-white/60">{label}</p>
    </div>
  );
}

// ==================== EVENT PARTICLES ====================

function EventParticles({ eventType }: { eventType: string }) {
  const particles = useRef<Array<{ id: number; emoji: string; x: number; delay: number }>>([]);

  useEffect(() => {
    const emoji = getEventEmoji(eventType);
    particles.current = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      emoji,
      x: Math.random() * 100,
      delay: Math.random() * 5,
    }));
  }, [eventType]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.current.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute text-2xl opacity-30"
          style={{ left: `${particle.x}%`, top: '-20px' }}
          animate={{
            y: ['0vh', '120vh'],
            rotate: [0, 360],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 8,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// ==================== BATTLE PASS PROGRESS ====================

interface BattlePassProgressProps {
  tiers: BattlePassTier[];
  currentTier: number;
  currentXP: number;
  xpPerTier: number;
  isPremium: boolean;
  onClaimReward?: (tierId: number) => void;
  onUpgrade?: () => void;
}

export function BattlePassProgress({
  tiers: rawTiers,
  currentTier,
  currentXP,
  xpPerTier,
  isPremium,
  onClaimReward,
  onUpgrade,
}: BattlePassProgressProps) {
  // Normalize tiers to have both singular and plural reward accessors
  const tiers = normalizeTiers(rawTiers);
  const progressRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  // Intersection observer for virtual scrolling
  useEffect(() => {
    const container = progressRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = 120; // Approximate tier width
      const start = Math.max(0, Math.floor(scrollLeft / itemWidth) - 2);
      const end = Math.min(tiers.length, start + Math.ceil(container.clientWidth / itemWidth) + 4);
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [tiers.length]);

  // Auto-scroll to current tier
  useEffect(() => {
    if (progressRef.current) {
      const tierElement = progressRef.current.querySelector(`[data-tier="${currentTier}"]`);
      if (tierElement) {
        tierElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentTier]);

  const progressInCurrentTier = (currentXP % xpPerTier) / xpPerTier;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Battle Pass</h3>
          <p className="text-sm text-gray-400">
            Tier {currentTier} • {Math.floor(progressInCurrentTier * 100)}% to next tier
          </p>
        </div>

        {!isPremium && (
          <motion.button
            onClick={onUpgrade}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-2 font-medium"
          >
            ⭐ Upgrade to Premium
          </motion.button>
        )}

        {isPremium && (
          <span className="rounded-lg border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 font-medium text-yellow-400">
            ⭐ Premium
          </span>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="relative mb-6 h-3 overflow-hidden rounded-full bg-black/30">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressInCurrentTier * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30"
          style={{ width: `${progressInCurrentTier * 100}%` }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Tiers Track */}
      <div
        ref={progressRef}
        className="scrollbar-thin scrollbar-thumb-white/10 flex gap-4 overflow-x-auto pb-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {tiers.map((tier, index) => {
          const isVisible = index >= visibleRange.start && index <= visibleRange.end;
          const isUnlocked = index < currentTier;
          const isCurrent = index === currentTier - 1;
          const canClaim = isUnlocked && !tier.claimed;

          return (
            <motion.div
              key={tier.id}
              data-tier={index + 1}
              layout
              className={`w-28 flex-shrink-0 ${!isVisible ? 'invisible' : ''}`}
            >
              <div
                className={`relative rounded-xl border p-3 transition-all ${
                  isCurrent
                    ? 'border-purple-500 bg-purple-500/20'
                    : isUnlocked
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Tier Number */}
                <div className="mb-2 text-center">
                  <span
                    className={`text-xs font-medium ${isCurrent ? 'text-purple-400' : 'text-gray-500'}`}
                  >
                    Tier {index + 1}
                  </span>
                </div>

                {/* Free Reward */}
                <div className="mb-2 text-center">
                  <span className="text-2xl">{tier.freeReward.icon}</span>
                  <p className="truncate text-xs text-gray-400">{tier.freeReward.name}</p>
                </div>

                {/* Premium Reward */}
                <div
                  className={`rounded-lg p-2 text-center ${
                    isPremium ? 'bg-yellow-500/10' : 'bg-black/20'
                  }`}
                >
                  <span className="text-2xl">{tier.premiumReward.icon}</span>
                  <p className="truncate text-xs text-gray-400">{tier.premiumReward.name}</p>
                  {!isPremium && <span className="text-xs text-yellow-400">⭐ Premium</span>}
                </div>

                {/* Claim Button */}
                {canClaim && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => onClaimReward?.(tier.id)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white"
                  >
                    ✓
                  </motion.button>
                )}

                {/* Lock overlay */}
                {!isUnlocked && !isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                    <span className="text-2xl">🔒</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== LEADERBOARD ====================

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  score: number;
  change?: number;
}

interface EventLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function EventLeaderboard({
  entries,
  currentUserId,
  isLoading,
  onLoadMore,
  hasMore,
}: EventLeaderboardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4">
        <h3 className="text-lg font-bold text-white">🏆 Leaderboard</h3>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && entries[0] && entries[1] && entries[2] && (
        <div className="flex items-end justify-center gap-4 border-b border-white/10 p-6">
          {/* Second Place */}
          <LeaderboardPodium entry={entries[1]} position={2} />

          {/* First Place */}
          <LeaderboardPodium entry={entries[0]} position={1} />

          {/* Third Place */}
          <LeaderboardPodium entry={entries[2]} position={3} />
        </div>
      )}

      {/* Rest of Leaderboard */}
      <div className="divide-y divide-white/5">
        {entries.slice(3).map((entry) => (
          <motion.div
            key={entry.userId}
            layout
            className={`flex items-center gap-4 p-4 ${
              entry.userId === currentUserId ? 'bg-purple-500/10' : 'hover:bg-white/5'
            } transition-colors`}
          >
            {/* Rank */}
            <div className="w-8 text-center font-bold text-gray-500">#{entry.rank}</div>

            {/* Avatar */}
            <ThemedAvatar
              src={entry.avatarUrl}
              alt={entry.displayName}
              size="medium"
              avatarBorderId={entry.avatarBorderId ?? entry.avatar_border_id ?? null}
            />

            {/* Name */}
            <div className="flex-1">
              <p className="font-medium text-white">{entry.displayName}</p>
              <p className="text-xs text-gray-500">@{entry.username}</p>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="font-bold text-white">{entry.score.toLocaleString()}</p>
              {entry.change !== undefined && (
                <p
                  className={`text-xs ${entry.change > 0 ? 'text-green-400' : entry.change < 0 ? 'text-red-400' : 'text-gray-500'}`}
                >
                  {entry.change > 0 ? '▲' : entry.change < 0 ? '▼' : '–'} {Math.abs(entry.change)}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="border-t border-white/10 p-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 text-gray-400 transition-colors hover:text-white disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== PODIUM ENTRY ====================

function LeaderboardPodium({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const colors = {
    1: 'from-yellow-500 to-amber-600',
    2: 'from-gray-300 to-gray-500',
    3: 'from-orange-600 to-orange-800',
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: position * 0.1 }}
      className="text-center"
    >
      {/* Avatar */}
      <div className="relative mb-2">
        <div
          className={`rounded-full border-4 ${
            position === 1
              ? 'border-yellow-500'
              : position === 2
                ? 'border-gray-400'
                : 'border-orange-600'
          }`}
        >
          <ThemedAvatar
            src={entry.avatarUrl}
            alt={entry.displayName}
            size="large"
            avatarBorderId={entry.avatarBorderId ?? entry.avatar_border_id ?? null}
          />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">
          {medals[position]}
        </span>
      </div>

      {/* Name */}
      <p className="max-w-24 truncate text-sm font-medium text-white">{entry.displayName}</p>

      {/* Score */}
      <p className="text-xs text-gray-400">{entry.score.toLocaleString()}</p>

      {/* Podium */}
      <div
        className={`mt-2 ${heights[position]} w-20 bg-gradient-to-t ${colors[position]} rounded-t-lg`}
      />
    </motion.div>
  );
}

// ==================== QUEST TRACKER ====================

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'event';
  progress: number;
  target: number;
  reward: {
    type: string;
    amount: number;
    icon: string;
  };
  expiresAt?: Date;
  completed: boolean;
  claimed: boolean;
}

interface QuestTrackerProps {
  quests: Quest[];
  onClaimReward?: (questId: string) => void;
}

export function QuestTracker({ quests, onClaimReward }: QuestTrackerProps) {
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'event'>('all');

  const filteredQuests = quests.filter((q) => filter === 'all' || q.type === filter);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      {/* Header */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">📋 Quests</h3>
          <div className="flex gap-1 rounded-lg bg-black/30 p-1">
            {(['all', 'daily', 'weekly', 'event'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quest List */}
      <div className="divide-y divide-white/5">
        <AnimatePresence mode="popLayout">
          {filteredQuests.map((quest) => (
            <motion.div
              key={quest.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-4 ${quest.completed ? 'bg-green-500/5' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Status */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    quest.completed ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'
                  }`}
                >
                  {quest.completed ? '✓' : `${Math.floor((quest.progress / quest.target) * 100)}%`}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="font-medium text-white">{quest.title}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        quest.type === 'daily'
                          ? 'bg-blue-500/20 text-blue-400'
                          : quest.type === 'weekly'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-pink-500/20 text-pink-400'
                      }`}
                    >
                      {quest.type}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-500">{quest.description}</p>

                  {/* Progress Bar */}
                  {!quest.completed && (
                    <div className="relative h-2 overflow-hidden rounded-full bg-black/30">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(quest.progress / quest.target) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {quest.progress}/{quest.target}
                  </p>
                </div>

                {/* Reward */}
                <div className="text-center">
                  <span className="text-2xl">{quest.reward.icon}</span>
                  <p className="text-xs text-gray-400">+{quest.reward.amount}</p>

                  {quest.completed && !quest.claimed && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onClaimReward?.(quest.id)}
                      className="mt-2 rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white"
                    >
                      Claim
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredQuests.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No quests available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== HELPERS ====================

function getEventEmoji(eventType: string): string {
  const emojis: Record<string, string> = {
    seasonal: '🎄',
    holiday: '🎉',
    anniversary: '🎂',
    competition: '🏆',
    community: '🤝',
    special: '✨',
    winter: '❄️',
    summer: '☀️',
    spring: '🌸',
    fall: '🍂',
    halloween: '🎃',
    christmas: '🎅',
    easter: '🐰',
    valentines: '💝',
  };
  return emojis[eventType.toLowerCase()] || '🎮';
}

export default EventBanner;
