/**
 * Event Banner component with countdown and variants
 * @module modules/gamification/components/events/event-banner/banner
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getEventEmoji } from './utils';
import type { EventBannerProps, TimeRemaining } from './types';

/**
 * Countdown unit display component
 */
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

/**
 * Animated particles background for events
 */
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

/**
 * Custom hook for countdown timer
 */
function useCountdown(endsAt: string): TimeRemaining | null {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = 0;

    const updateCountdown = (timestamp: number) => {
      // Throttle to once per second
      if (timestamp - lastUpdate >= 1000) {
        const now = new Date();
        const end = new Date(endsAt);
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
  }, [endsAt]);

  return timeRemaining;
}

/**
 * Main EventBanner component with multiple variants
 */
export function EventBanner({ event, variant = 'full', onClick }: EventBannerProps) {
  const timeRemaining = useCountdown(event.endsAt);

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
