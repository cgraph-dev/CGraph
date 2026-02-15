import { useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_TITLES, RARITY_COLORS } from './constants';

const RARITY_ORDER = [
  'all',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'unique',
] as const;

export const TitlesDemo = memo(function TitlesDemo() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedTitle, setSelectedTitle] = useState(DEMO_TITLES[4]); // Cyber Punk default

  const filteredTitles = useMemo(
    () =>
      activeFilter === 'all' ? DEMO_TITLES : DEMO_TITLES.filter((t) => t.rarity === activeFilter),
    [activeFilter]
  );

  return (
    <div className="demo-titles">
      {/* Selected title preview */}
      <div className="demo-titles__preview">
        <span className="demo-titles__preview-label">Equipped Title</span>
        <span
          className={`demo-titles__preview-title demo-titles__preview-title--${selectedTitle?.animation} demo-titles__preview-title--id-${selectedTitle?.id} demo-titles__preview-title--rarity-${selectedTitle?.rarity}`}
          style={{ color: selectedTitle?.color }}
        >
          {selectedTitle?.name}
        </span>
      </div>

      {/* Rarity filter pills */}
      <div className="demo-titles__filters">
        {RARITY_ORDER.map((r) => {
          const rColor = r === 'all' ? '#fff' : (RARITY_COLORS[r]?.primary ?? '#fff');
          return (
            <button
              key={r}
              type="button"
              className={`demo-titles__filter-pill ${activeFilter === r ? 'active' : ''}`}
              style={
                activeFilter === r
                  ? { background: rColor, color: r === 'common' || r === 'all' ? '#111' : '#fff' }
                  : { borderColor: `${rColor}44`, color: rColor }
              }
              onClick={() => setActiveFilter(r)}
            >
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Title cards grid */}
      <div className="demo-titles__grid">
        <AnimatePresence mode="popLayout">
          {filteredTitles.map((title, i) => {
            const rc = RARITY_COLORS[title.rarity];
            return (
              <motion.button
                type="button"
                key={title.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className={`demo-title-card demo-title-card--id-${title.id} demo-title-card--rarity-${title.rarity} ${selectedTitle?.id === title.id ? 'demo-title-card--selected' : ''}`}
                style={{
                  borderLeftColor: rc?.primary,
                }}
                onClick={() => setSelectedTitle(title)}
              >
                <div className="demo-title-card__top">
                  <span
                    className={`demo-title-card__name demo-title-card__name--${title.animation} demo-title-card__name--rarity-${title.rarity}`}
                    style={{ color: title.color }}
                  >
                    {title.name}
                  </span>
                </div>
                <div className="demo-title-card__bottom">
                  <span
                    className="demo-title-card__rarity"
                    style={{ background: `${rc?.primary}22`, color: rc?.primary }}
                  >
                    {title.rarity}
                  </span>
                  <span className="demo-title-card__unlock">{title.unlock}</span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="demo-titles__footer">
        <span>40+ titles across 7 rarity tiers in the full app</span>
      </div>
    </div>
  );
});
