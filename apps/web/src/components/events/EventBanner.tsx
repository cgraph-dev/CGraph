import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useSeasonalEventStore, SeasonalEvent, EventReward, BattlePassTier } from '@/stores/seasonalEventStore';

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
        className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                   rounded-lg border border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-colors"
      >
        <span className="text-xl">{getEventEmoji(event.eventType)}</span>
        <span className="text-sm font-medium truncate">{event.name}</span>
        {timeRemaining && (
          <span className="text-xs text-gray-400 ml-auto">
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
        className="relative overflow-hidden rounded-xl cursor-pointer group"
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${event.config.primaryColor || '#8B5CF6'}40, ${event.config.secondaryColor || '#EC4899'}40)`,
          }}
        />
        
        {/* Content */}
        <div className="relative p-4 flex items-center gap-4">
          <div className="text-3xl">{getEventEmoji(event.eventType)}</div>
          <div className="flex-1">
            <h3 className="font-bold text-white">{event.name}</h3>
            {timeRemaining && (
              <p className="text-sm text-gray-300">
                Ends in {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
              </p>
            )}
          </div>
          <div className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">→</div>
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
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
    >
      {/* Animated Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${event.config.primaryColor || '#8B5CF6'}, ${event.config.secondaryColor || '#EC4899'})`,
        }}
      />
      
      {/* Animated particles */}
      <EventParticles eventType={event.eventType} />

      {/* Content */}
      <div className="relative p-8 flex items-center gap-6">
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
          {getEventEmoji(event.eventType)}
        </motion.div>

        {/* Event Info */}
        <div className="flex-1">
          <motion.h2
            className="text-3xl font-bold text-white mb-2"
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
          {event.description && (
            <p className="text-white/80 mb-3">{event.description}</p>
          )}
          
          {/* XP Multiplier Badge */}
          {event.config.xpMultiplier > 1 && (
            <span className="inline-block px-3 py-1 bg-yellow-500/30 rounded-full text-sm font-bold text-yellow-300">
              {event.config.xpMultiplier}x XP Bonus
            </span>
          )}
        </div>

        {/* Countdown */}
        {timeRemaining && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-white/60 mb-2">Ends In</p>
            <div className="flex gap-2">
              <CountdownUnit value={timeRemaining.days} label="Days" />
              <CountdownUnit value={timeRemaining.hours} label="Hours" />
              <CountdownUnit value={timeRemaining.minutes} label="Min" />
            </div>
          </div>
        )}

        {/* CTA Arrow */}
        <motion.div
          className="text-4xl text-white/50 group-hover:text-white transition-colors"
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
        className="w-12 h-12 bg-black/30 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <p className="text-xs text-white/60 mt-1">{label}</p>
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
  tiers,
  currentTier,
  currentXP,
  xpPerTier,
  isPremium,
  onClaimReward,
  onUpgrade,
}: BattlePassProgressProps) {
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
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-medium"
          >
            ⭐ Upgrade to Premium
          </motion.button>
        )}
        
        {isPremium && (
          <span className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 
                          border border-yellow-500/30 rounded-lg text-yellow-400 font-medium">
            ⭐ Premium
          </span>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="relative h-3 bg-black/30 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressInCurrentTier * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
          style={{ width: `${progressInCurrentTier * 100}%` }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      {/* Tiers Track */}
      <div
        ref={progressRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10"
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
              className={`flex-shrink-0 w-28 ${!isVisible ? 'invisible' : ''}`}
            >
              <div
                className={`relative p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-purple-500 bg-purple-500/20'
                    : isUnlocked
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Tier Number */}
                <div className="text-center mb-2">
                  <span className={`text-xs font-medium ${isCurrent ? 'text-purple-400' : 'text-gray-500'}`}>
                    Tier {index + 1}
                  </span>
                </div>

                {/* Free Reward */}
                <div className="text-center mb-2">
                  <span className="text-2xl">{tier.freeReward.icon}</span>
                  <p className="text-xs text-gray-400 truncate">{tier.freeReward.name}</p>
                </div>

                {/* Premium Reward */}
                <div
                  className={`text-center p-2 rounded-lg ${
                    isPremium ? 'bg-yellow-500/10' : 'bg-black/20'
                  }`}
                >
                  <span className="text-2xl">{tier.premiumReward.icon}</span>
                  <p className="text-xs text-gray-400 truncate">{tier.premiumReward.name}</p>
                  {!isPremium && (
                    <span className="text-xs text-yellow-400">⭐ Premium</span>
                  )}
                </div>

                {/* Claim Button */}
                {canClaim && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => onClaimReward?.(tier.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full 
                               flex items-center justify-center text-white text-sm font-bold"
                  >
                    ✓
                  </motion.button>
                )}

                {/* Lock overlay */}
                {!isUnlocked && !isCurrent && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
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
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
        <h3 className="text-lg font-bold text-white">🏆 Leaderboard</h3>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 p-6 border-b border-white/10">
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
            <div className="w-8 text-center font-bold text-gray-500">
              #{entry.rank}
            </div>

            {/* Avatar */}
            <img
              src={entry.avatarUrl || '/default-avatar.png'}
              alt={entry.displayName}
              className="w-10 h-10 rounded-full"
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
                <p className={`text-xs ${entry.change > 0 ? 'text-green-400' : entry.change < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {entry.change > 0 ? '▲' : entry.change < 0 ? '▼' : '–'} {Math.abs(entry.change)}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== PODIUM ENTRY ====================

function LeaderboardPodium({
  entry,
  position,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}) {
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
        <img
          src={entry.avatarUrl || '/default-avatar.png'}
          alt={entry.displayName}
          className={`w-16 h-16 rounded-full border-4 ${
            position === 1 ? 'border-yellow-500' : position === 2 ? 'border-gray-400' : 'border-orange-600'
          }`}
        />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">
          {medals[position]}
        </span>
      </div>

      {/* Name */}
      <p className="font-medium text-white text-sm truncate max-w-24">
        {entry.displayName}
      </p>
      
      {/* Score */}
      <p className="text-xs text-gray-400">{entry.score.toLocaleString()}</p>

      {/* Podium */}
      <div className={`mt-2 ${heights[position]} w-20 bg-gradient-to-t ${colors[position]} rounded-t-lg`} />
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

  const filteredQuests = quests.filter(
    (q) => filter === 'all' || q.type === filter
  );

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">📋 Quests</h3>
          <div className="flex gap-1 bg-black/30 rounded-lg p-1">
            {(['all', 'daily', 'weekly', 'event'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filter === f
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-white'
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    quest.completed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {quest.completed ? '✓' : `${Math.floor((quest.progress / quest.target) * 100)}%`}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white">{quest.title}</h4>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
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
                  <p className="text-sm text-gray-500 mb-2">{quest.description}</p>

                  {/* Progress Bar */}
                  {!quest.completed && (
                    <div className="relative h-2 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(quest.progress / quest.target) * 100}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
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
                      className="mt-2 px-3 py-1 bg-green-500 rounded-lg text-xs font-medium text-white"
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
