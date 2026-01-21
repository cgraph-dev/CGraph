/**
 * GamingStatsGrid Component
 * 
 * Animated stats display grid for gaming profiles.
 * Shows level, XP, achievements, rank with visual effects.
 */

import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { springs } from '@/lib/animationPresets';

interface StatItem {
  label: string;
  value: number | string;
  icon?: string;
  suffix?: string;
  color?: string;
  animate?: boolean;
}

interface GamingStatsGridProps {
  stats?: StatItem[];
  level?: number;
  xp?: number;
  maxXp?: number;
  rank?: string;
  rankIcon?: string;
  achievements?: number;
  className?: string;
}

/**
 * Animated counter component
 */
function AnimatedCounter({
  value,
  duration = 1,
  suffix = '',
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  // Spring value for smooth transitions (using motionValue directly for animation)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  return (
    <span>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

/**
 * XP Progress Bar with animations
 */
function XPProgressBar({
  current,
  max,
  level,
}: {
  current: number;
  max: number;
  level: number;
}) {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="relative w-full">
      {/* Level badge */}
      <motion.div
        className="absolute -top-6 left-0 flex items-center gap-1"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springs.bouncy}
      >
        <div className="relative">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-black shadow-lg"
            animate={{
              boxShadow: [
                '0 0 10px rgba(251, 191, 36, 0.5)',
                '0 0 20px rgba(251, 191, 36, 0.8)',
                '0 0 10px rgba(251, 191, 36, 0.5)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {level}
          </motion.div>
          {/* Rotating ring */}
          <motion.div
            className="absolute -inset-1 rounded-full border-2 border-amber-400/50"
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              borderStyle: 'dashed',
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground">Level</span>
      </motion.div>

      {/* Progress bar container */}
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Glowing edge */}
        <motion.div
          className="absolute inset-y-0 w-2 bg-white/80 blur-sm"
          initial={{ left: 0 }}
          animate={{ left: `calc(${percentage}% - 4px)` }}
          transition={{
            duration: 1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>

      {/* XP text */}
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>
          <AnimatedCounter value={current} /> XP
        </span>
        <span>{max.toLocaleString()} XP</span>
      </div>
    </div>
  );
}

/**
 * Stat Card with icon and animated value
 */
function StatCard({
  label,
  value,
  icon,
  suffix = '',
  color = '#667eea',
  animate: shouldAnimate = true,
}: StatItem) {
  const isNumber = typeof value === 'number';

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center rounded-lg bg-black/20 p-3 backdrop-blur-sm"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={springs.snappy}
    >
      {/* Icon */}
      {icon && (
        <motion.span
          className="mb-1 text-2xl"
          animate={shouldAnimate ? {
            y: [0, -2, 0],
          } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {icon}
        </motion.span>
      )}

      {/* Value */}
      <div
        className="text-lg font-bold"
        style={{ color }}
      >
        {isNumber && shouldAnimate ? (
          <AnimatedCounter value={value} suffix={suffix} />
        ) : (
          `${value}${suffix}`
        )}
      </div>

      {/* Label */}
      <div className="text-xs text-muted-foreground">{label}</div>

      {/* Glow */}
      <div
        className="absolute inset-0 -z-10 rounded-lg opacity-20 blur-xl"
        style={{ background: color }}
      />
    </motion.div>
  );
}

export default function GamingStatsGrid({
  stats,
  level = 42,
  xp = 7500,
  maxXp = 10000,
  rank = 'Diamond',
  rankIcon = '💎',
  achievements = 127,
  className = '',
}: GamingStatsGridProps) {
  const defaultStats: StatItem[] = [
    { label: 'Rank', value: rank, icon: rankIcon, color: '#60a5fa' },
    { label: 'Achievements', value: achievements, icon: '🏆', color: '#fbbf24' },
    { label: 'Win Rate', value: 68, icon: '📊', suffix: '%', color: '#10b981' },
    { label: 'Matches', value: 1420, icon: '⚔️', color: '#f43f5e' },
  ];

  const displayStats = stats || defaultStats;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* XP Bar */}
      <div className="pt-6">
        <XPProgressBar current={xp} max={maxXp} level={level} />
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {displayStats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { scale: 0.8, opacity: 0 },
              visible: { scale: 1, opacity: 1 },
            }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export { AnimatedCounter, XPProgressBar, StatCard };
