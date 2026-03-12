import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS, RARITY_COLORS } from './constants';

/** Deterministic fake progress for each achievement (seeded by index) */
function fakeProgress(index: number): number {
  const seeds = [92, 45, 78, 33, 61, 87, 55, 20];
  return seeds[index % seeds.length] ?? 50;
}

export const AchievementsDemo = memo(function AchievementsDemo() {
  const achievements = useMemo(
    () =>
      ACHIEVEMENTS.map((a, i) => ({
        ...a,
        progress: fakeProgress(i),
      })),
    []
  );

  return (
    <div className="demo-ach-tab">
      {/* Stats header */}
      <div className="demo-ach-tab__stats">
        <div className="demo-ach-tab__stat">
          <span className="demo-ach-tab__stat-value">5 / 8</span>
          <span className="demo-ach-tab__stat-label">Unlocked</span>
        </div>
        <div className="demo-ach-tab__stat">
          <span className="demo-ach-tab__stat-value">12</span>
          <span className="demo-ach-tab__stat-label">Cosmetics</span>
        </div>
        <div className="demo-ach-tab__stat">
          <span className="demo-ach-tab__stat-value">6</span>
          <span className="demo-ach-tab__stat-label">Categories</span>
        </div>
      </div>

      {/* Achievement cards grid */}
      <div className="demo-ach-tab__grid">
        {achievements.map((ach, i) => {
          const rc = RARITY_COLORS[ach.rarity];
          const isComplete = ach.progress >= 100;
          return (
            <motion.div
              key={ach.id}
              className={`demo-ach-card ${isComplete ? 'demo-ach-card--complete' : ''}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              style={{ borderLeftColor: rc?.primary }}
            >
              <div className="demo-ach-card__header">
                <span className="demo-ach-card__icon">{ach.icon}</span>
                <div className="demo-ach-card__info">
                  <span className="demo-ach-card__name">{ach.name}</span>
                  <span className="demo-ach-card__desc">{ach.desc}</span>
                </div>
              </div>

              <div className="demo-ach-card__progress-row">
                <div className="demo-ach-card__progress-bar">
                  <motion.div
                    className="demo-ach-card__progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${ach.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
                    style={{ background: rc?.primary }}
                  />
                </div>
                <span className="demo-ach-card__progress-text">{ach.progress}%</span>
              </div>

              <div className="demo-ach-card__footer">
                <span
                  className="demo-ach-card__rarity"
                  style={{ background: `${rc?.primary}22`, color: rc?.primary }}
                >
                  {ach.rarity}
                </span>
              </div>
              {(ach.coins || ach.titleReward || ach.itemReward) && (
                <div className="demo-ach-card__rewards">
                  {ach.coins && (
                    <span className="demo-ach-card__reward demo-ach-card__reward--coins">
                      💎 +{ach.coins} Nodes
                    </span>
                  )}
                  {ach.titleReward && (
                    <span className="demo-ach-card__reward demo-ach-card__reward--title">
                      🏷️ {ach.titleReward}
                    </span>
                  )}
                  {ach.itemReward && (
                    <span className="demo-ach-card__reward demo-ach-card__reward--item">
                      🎁 {ach.itemReward}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="demo-ach-tab__footer">
        <span>25+ achievements with progress tracking in the full app</span>
      </div>
    </div>
  );
});
