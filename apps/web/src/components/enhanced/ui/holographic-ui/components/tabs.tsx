/**
 * HoloTabs Component
 * @module components/enhanced/ui/holographic-ui/components/tabs
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { HoloTabsProps } from '../types';
import { getTheme } from '../presets';

/**
 * unknown for the enhanced module.
 */
/**
 * Holo Tabs component.
 */
export function HoloTabs({
  tabs,
  activeTab,
  onChange,
  preset = 'cyan',
  fullWidth = false,
  className,
}: HoloTabsProps) {
  const theme = getTheme(preset);

  return (
    <div
      className={cn('inline-flex gap-1 rounded-lg p-1', fullWidth && 'w-full', className)}
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <motion.button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'relative flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              fullWidth && 'flex-1',
              tab.disabled && 'cursor-not-allowed opacity-50'
            )}
            style={{
              color: isActive ? theme.background : theme.textMuted,
              background: isActive ? theme.primary : 'transparent',
            }}
            whileHover={tab.disabled ? {} : { scale: 1.02 }}
            whileTap={tab.disabled ? {} : { scale: 0.98 }}
          >
            {tab.icon}
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 rounded-md"
                style={{
                  background: theme.primary,
                  boxShadow: `0 0 12px ${theme.glow}`,
                  zIndex: -1,
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
