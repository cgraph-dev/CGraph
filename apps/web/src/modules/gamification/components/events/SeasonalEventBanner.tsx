import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonalEventStore, useFeaturedEvent } from '@/stores/gamification';
import { XMarkIcon, SparklesIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SeasonalEventBanner');

/**
 * SeasonalEventBanner Component
 *
 * Displays the featured seasonal event with:
 * - Eye-catching banner design
 * - Time remaining countdown
 * - Quick join/view button
 * - Dismissible notification
 */

interface SeasonalEventBannerProps {
  showDismiss?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}

export default function SeasonalEventBanner({
  showDismiss = true,
  onDismiss,
  compact = false,
  className = '',
}: SeasonalEventBannerProps) {
  const featuredEvent = useFeaturedEvent();
  const { fetchEvents, getTimeRemaining, joinEvent, isJoining } = useSeasonalEventStore();

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh time remaining every minute
  useEffect(() => {
    if (!featuredEvent) return;

    const interval = setInterval(() => {
      // Force re-render to update time
      fetchEvents();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [featuredEvent, fetchEvents]);

  if (!featuredEvent || !featuredEvent.isActive) {
    return null;
  }

  const timeRemaining = getTimeRemaining(featuredEvent.id);
  const isEnding = timeRemaining && timeRemaining.days < 3;

  const handleJoin = async () => {
    const result = await joinEvent(featuredEvent.id);
    if (result.success) {
      logger.debug('Joined event successfully');
    }
  };

  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`relative ${className}`}
        >
          <div
            className="relative overflow-hidden rounded-lg border border-white/10 p-4"
            style={{
              background: `linear-gradient(135deg, ${featuredEvent.colors.primary}22 0%, ${featuredEvent.colors.secondary}22 100%)`,
            }}
          >
            {/* Compact content */}
            <div className="flex items-center gap-3">
              {featuredEvent.iconUrl && (
                <img
                  src={featuredEvent.iconUrl}
                  alt={featuredEvent.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-yellow-400" />
                  <span className="truncate font-semibold text-white">{featuredEvent.name}</span>
                </div>
                {timeRemaining && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>
                      {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m left
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative ${className}`}
      >
        <GlassCard variant="crystal" glow glowColor={featuredEvent.colors.accent}>
          {/* Background image */}
          {featuredEvent.bannerUrl && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <img
                src={featuredEvent.bannerUrl}
                alt={featuredEvent.name}
                className="h-full w-full object-cover opacity-30"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${featuredEvent.colors.primary}44 0%, ${featuredEvent.colors.secondary}44 100%)`,
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="relative z-10">
            {/* Dismiss button */}
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="absolute right-4 top-4 rounded-lg bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/40 hover:text-white"
                aria-label="Dismiss"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}

            {/* Event header */}
            <div className="mb-4 flex items-start gap-4">
              {featuredEvent.iconUrl && (
                <img
                  src={featuredEvent.iconUrl}
                  alt={featuredEvent.name}
                  className="h-16 w-16 rounded-xl border-2 border-white/20 object-cover"
                />
              )}
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-yellow-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                    {featuredEvent.type.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">{featuredEvent.name}</h3>
                <p className="text-sm leading-relaxed text-white/80">{featuredEvent.description}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="mb-4 grid grid-cols-3 gap-4">
              {/* Time remaining */}
              {timeRemaining && (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <ClockIcon className={`h-5 w-5 ${isEnding ? 'text-red-400' : 'text-blue-400'}`} />
                  <div>
                    <div
                      className={`text-sm font-semibold ${isEnding ? 'text-red-400' : 'text-white'}`}
                    >
                      {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                    </div>
                    <div className="text-xs text-white/60">
                      {isEnding ? 'Ending soon!' : 'Time left'}
                    </div>
                  </div>
                </div>
              )}

              {/* Battle pass */}
              {featuredEvent.hasBattlePass && (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <TrophyIcon className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {featuredEvent.battlePassCost} coins
                    </div>
                    <div className="text-xs text-white/60">Battle Pass</div>
                  </div>
                </div>
              )}

              {/* Leaderboard */}
              {featuredEvent.hasLeaderboard && (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <TrophyIcon className="h-5 w-5 text-yellow-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">Leaderboard</div>
                    <div className="text-xs text-white/60">Compete for prizes</div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="flex-1 rounded-lg px-6 py-3 font-semibold text-white transition-all disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${featuredEvent.colors.primary} 0%, ${featuredEvent.colors.secondary} 100%)`,
                }}
              >
                {isJoining ? 'Joining...' : 'Join Event'}
              </button>
              <button className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/20">
                View Details
              </button>
            </div>

            {/* Multipliers badge (if any) */}
            {featuredEvent.multipliers && (
              <div className="mt-3 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-white/70">
                  Active bonuses:
                  {featuredEvent.multipliers.xp > 1 && ` ${featuredEvent.multipliers.xp}x XP`}
                  {featuredEvent.multipliers.coins > 1 &&
                    ` ${featuredEvent.multipliers.coins}x Coins`}
                  {featuredEvent.multipliers.karma > 1 &&
                    ` ${featuredEvent.multipliers.karma}x Karma`}
                </span>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </AnimatePresence>
  );
}
