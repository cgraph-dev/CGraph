import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InteractiveDemoProps } from './types';
import { DEMO_TABS } from './constants';
import { ChatDemo } from './ChatDemo';
import { TitlesDemo } from './TitlesDemo';
import { AchievementsDemo } from './AchievementsDemo';
import { ForumsDemo } from './ForumsDemo';
import { FlowingBorder } from '../customization-demo/effects';

export const InteractiveDemo = memo(function InteractiveDemo({
  className = '',
}: InteractiveDemoProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const footerMessages: Record<string, string> = {
    chat: '🔒 End-to-end encrypted • Try it yourself!',
    titles: '🏷️ Preview premium cosmetics and badge styles instantly.',
    achievements: '🏆 Track milestone progress and unlock achievements.',
    forums: '💬 Explore community forums with threads, voting, and karma.',
  };

  return (
    <div className={`interactive-demo panel-border-glow ${className}`}>
      <FlowingBorder borderRadius="24px" />
      <div className="interactive-demo__header">
        <div className="flex flex-wrap justify-center gap-2">
          {DEMO_TABS.map((tab) => (
            <motion.button
              key={tab.id}
              type="button"
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/30'
              }`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.label}
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
            {activeTab === 'forums' && <ForumsDemo />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="interactive-demo__footer">
        <span>{footerMessages[activeTab] ?? footerMessages.chat}</span>
      </div>
    </div>
  );
});

export default InteractiveDemo;
