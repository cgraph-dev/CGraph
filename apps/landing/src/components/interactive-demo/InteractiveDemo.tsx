import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InteractiveDemoProps } from './types';
import { DEMO_TABS } from './constants';
import { ChatDemo } from './ChatDemo';
import { TitlesDemo } from './TitlesDemo';
import { AchievementsDemo } from './AchievementsDemo';
import { GamificationDemo } from './GamificationDemo';
import { FlowingBorder } from '../customization-demo/effects';

export const InteractiveDemo = memo(function InteractiveDemo({
  className = '',
}: InteractiveDemoProps) {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className={`interactive-demo panel-border-glow ${className}`}>
      <FlowingBorder borderRadius="24px" />
      <div className="interactive-demo__header">
        <div className="interactive-demo__tabs">
          {DEMO_TABS.map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              className={`interactive-demo__tab demo-tab-affordance group ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="interactive-demo__tab-ring" />
              <span className="interactive-demo__tab-glow" />
              <span className="demo-tab-affordance__label">{tab.label}</span>
              <span className="interactive-demo__tab-shimmer" />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="interactive-demo__content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="interactive-demo__panel"
          >
            {activeTab === 'chat' && <ChatDemo />}
            {activeTab === 'titles' && <TitlesDemo />}
            {activeTab === 'achievements' && <AchievementsDemo />}
            {activeTab === 'gamify' && <GamificationDemo />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="interactive-demo__footer">
        <span>🔒 End-to-end encrypted • Try it yourself!</span>
      </div>
    </div>
  );
});

export default InteractiveDemo;
