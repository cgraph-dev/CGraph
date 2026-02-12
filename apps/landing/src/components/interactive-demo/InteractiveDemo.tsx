import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InteractiveDemoProps } from './types';
import { DEMO_TABS } from './constants';
import { ChatDemo } from './ChatDemo';
import { TitlesDemo } from './TitlesDemo';
import { AchievementsDemo } from './AchievementsDemo';
import { GamificationDemo } from './GamificationDemo';

export const InteractiveDemo = memo(function InteractiveDemo({
  className = '',
}: InteractiveDemoProps) {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className={`interactive-demo ${className}`}>
      <div className="interactive-demo__header">
        <div className="interactive-demo__tabs">
          {DEMO_TABS.map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              className={`interactive-demo__tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
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
