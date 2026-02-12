import { useState, memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ACTIVITY_FEED = [
  { icon: '⚡', text: 'Earned 150 XP from daily login', color: '#f59e0b' },
  { icon: '🔥', text: 'Streak extended to 43 days!', color: '#ef4444' },
  { icon: '🏆', text: 'Unlocked "Social Butterfly" title', color: '#22c55e' },
  { icon: '💎', text: 'Received 50 coins from achievement', color: '#8b5cf6' },
  { icon: '🎯', text: 'Completed daily challenge +200 XP', color: '#3b82f6' },
  { icon: '👑', text: 'Leveled up to Level 25!', color: '#f59e0b' },
  { icon: '🛡️', text: 'Earned "Guardian" badge', color: '#06b6d4' },
  { icon: '🌟', text: 'Ranked up to Gold tier', color: '#fbbf24' },
];

const STREAK_MILESTONES = [
  { days: 7, icon: '🔥', label: '7d' },
  { days: 14, icon: '💪', label: '14d' },
  { days: 30, icon: '⭐', label: '30d' },
  { days: 60, icon: '💎', label: '60d' },
  { days: 100, icon: '👑', label: '100d' },
];

export const GamificationDemo = memo(function GamificationDemo() {
  const [xp, setXp] = useState(2450);
  const [level, setLevel] = useState(24);
  const [streak, setStreak] = useState(42);
  const [coins, setCoins] = useState(1280);
  const [feedIndex, setFeedIndex] = useState(0);
  const xpToNext = 3000;
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    // Auto-increment XP every 2s
    const xpInterval = setInterval(() => {
      const earned = Math.floor(Math.random() * 120) + 30;
      setXp((prev) => {
        const next = prev + earned;
        if (next >= xpToNext) {
          setLevel((l) => l + 1);
          setCoins((c) => c + 50);
          return next - xpToNext;
        }
        return next;
      });
    }, 2000);

    // Cycle activity feed every 3s
    const feedInterval = setInterval(() => {
      setFeedIndex((i) => (i + 1) % ACTIVITY_FEED.length);
    }, 3000);

    // Bump streak every 8s
    const streakInterval = setInterval(() => {
      setStreak((s) => s + 1);
    }, 8000);

    intervalsRef.current = [xpInterval, feedInterval, streakInterval];
    return () => intervalsRef.current.forEach(clearInterval);
  }, []);

  const progress = (xp / xpToNext) * 100;
  const currentFeed = ACTIVITY_FEED.slice(feedIndex, feedIndex + 3).concat(
    ACTIVITY_FEED.slice(0, Math.max(0, feedIndex + 3 - ACTIVITY_FEED.length))
  );

  return (
    <div className="demo-gamify">
      {/* Stats row */}
      <div className="demo-gamify__stats">
        <motion.div
          className="demo-gamify__stat"
          key={`lvl-${level}`}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.3 }}
        >
          <span className="demo-gamify__stat-icon">🏅</span>
          <span className="demo-gamify__stat-value">{level}</span>
          <span className="demo-gamify__stat-label">Level</span>
        </motion.div>
        <motion.div
          className="demo-gamify__stat"
          key={`str-${streak}`}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.3 }}
        >
          <span className="demo-gamify__stat-icon">🔥</span>
          <span className="demo-gamify__stat-value">{streak}</span>
          <span className="demo-gamify__stat-label">Streak</span>
        </motion.div>
        <motion.div
          className="demo-gamify__stat"
          key={`coin-${coins}`}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.3 }}
        >
          <span className="demo-gamify__stat-icon">💎</span>
          <span className="demo-gamify__stat-value">{coins.toLocaleString()}</span>
          <span className="demo-gamify__stat-label">Coins</span>
        </motion.div>
      </div>

      {/* XP Bar */}
      <div className="demo-gamify__xp-section">
        <div className="demo-gamify__xp-header">
          <span>Level {level}</span>
          <span className="demo-gamify__xp-numbers">
            {xp.toLocaleString()} / {xpToNext.toLocaleString()} XP
          </span>
        </div>
        <div className="demo-gamify__xp-track">
          <motion.div
            className="demo-gamify__xp-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Streak milestones */}
      <div className="demo-gamify__milestones">
        {STREAK_MILESTONES.map((m) => (
          <div
            key={m.days}
            className={`demo-gamify__milestone ${streak >= m.days ? 'demo-gamify__milestone--done' : ''}`}
          >
            <span className="demo-gamify__milestone-icon">{m.icon}</span>
            <span className="demo-gamify__milestone-label">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="demo-gamify__feed">
        <span className="demo-gamify__feed-title">Live Activity</span>
        <AnimatePresence mode="popLayout">
          {currentFeed.map((item, i) => (
            <motion.div
              key={`${feedIndex}-${i}`}
              className="demo-gamify__feed-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <span className="demo-gamify__feed-icon" style={{ color: item.color }}>
                {item.icon}
              </span>
              <span className="demo-gamify__feed-text">{item.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});
