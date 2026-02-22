/**
 * Animated tabs component
 * @module modules/settings/components/customize/ui
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

import { THEME_COLORS as themeColors } from '@/modules/settings/store/customization';

import { uiSprings as springs } from './constants';
import type { AnimatedTabsProps } from './types';

export const AnimatedTabs = memo(function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  colorPreset = 'emerald',
  layoutId = 'activeTab',
}: AnimatedTabsProps) {
  const colors = themeColors[colorPreset];

  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <motion.button
            key={tab.id}
            className={`relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? 'text-white' : 'text-white/60 hover:text-white/80'
            }`}
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40)`,
                  boxShadow: `0 0 20px ${colors.glow}`,
                }}
                transition={springs.smooth}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
});
