import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS } from './constants';

export const GamificationDemo = memo(function GamificationDemo() {
  const [xp, setXp] = useState(2450);
  const [level, setLevel] = useState(24);
  const [unlockedAchievement, setUnlockedAchievement] = useState<string | null>(null);

  const xpToNextLevel = 3000;
  const progress = (xp / xpToNextLevel) * 100;

  const earnXp = useCallback(() => {
    const earned = Math.floor(Math.random() * 200) + 50;
    setXp((prev) => {
      const newXp = prev + earned;
      if (newXp >= xpToNextLevel) {
        setLevel((l) => l + 1);
        return newXp - xpToNextLevel;
      }
      return newXp;
    });

    // Random achievement unlock
    if (Math.random() > 0.7 && !unlockedAchievement) {
      const randomAchievement = ACHIEVEMENTS[Math.floor(Math.random() * ACHIEVEMENTS.length)];
      if (randomAchievement) {
        setUnlockedAchievement(randomAchievement.id);
        setTimeout(() => setUnlockedAchievement(null), 3000);
      }
    }
  }, [unlockedAchievement]);

  return (
    <div className="demo-gamification">
      {/* Level display */}
      <div className="demo-level">
        <motion.div
          className="demo-level__badge"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3 }}
          key={level}
        >
          <span className="demo-level__number">{level}</span>
        </motion.div>
        <div className="demo-level__info">
          <span className="demo-level__label">Level {level}</span>
          <div className="demo-xp-bar">
            <motion.div
              className="demo-xp-bar__fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="demo-xp-text">
            {xp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* Action button */}
      <motion.button
        type="button"
        className="demo-earn-xp"
        onClick={earnXp}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>⚡</span> Earn XP
      </motion.button>

      {/* Achievements */}
      <div className="demo-achievements">
        <span className="demo-achievements__label">Recent Achievements</span>
        <div className="demo-achievements__grid">
          {ACHIEVEMENTS.slice(0, 4).map((achievement) => (
            <motion.div
              key={achievement.id}
              className={`demo-achievement ${unlockedAchievement === achievement.id ? 'unlocking' : ''}`}
              animate={
                unlockedAchievement === achievement.id
                  ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                  : {}
              }
            >
              <span className="demo-achievement__icon">{achievement.icon}</span>
              <span className="demo-achievement__name">{achievement.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Achievement unlock notification */}
      <AnimatePresence>
        {unlockedAchievement && (
          <motion.div
            className="demo-unlock-notification"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>🎉 Achievement Unlocked!</span>
            <span>{ACHIEVEMENTS.find((a) => a.id === unlockedAchievement)?.name}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
