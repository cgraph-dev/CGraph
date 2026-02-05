/**
 * AnimatedTabs Component
 * Tabs with animated indicator and content transitions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TAB_SPRING_CONFIG } from './constants';
import type { AnimatedTabsProps } from './types';

export function AnimatedTabs({ tabs, className = '' }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  return (
    <div className={className}>
      {/* Tab buttons */}
      <div className="relative mb-8 flex gap-2 rounded-lg bg-gray-800/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute inset-0 rounded-md bg-emerald-500/20"
                layoutId="activeTab"
                transition={{ type: 'spring', ...TAB_SPRING_CONFIG }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </AnimatePresence>
    </div>
  );
}
