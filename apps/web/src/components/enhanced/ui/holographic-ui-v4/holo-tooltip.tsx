/**
 * HoloTooltip Component
 * @version 4.0.0
 */

import { ReactNode, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HoloPreset, getTheme } from './types';
import { tweens } from '@/lib/animation-presets';

interface HoloTooltipProps {
  children: ReactNode;
  content: ReactNode;
  preset?: HoloPreset;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

/**
 * unknown for the enhanced module.
 */
/**
 * Holo Tooltip component.
 */
export function HoloTooltip({
  children,
  content,
  preset = 'cyan',
  position = 'top',
  delay = 200,
  className,
}: HoloTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDelayed, setShowDelayed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = getTheme(preset);

  const positionStyles: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
    timeoutRef.current = setTimeout(() => setShowDelayed(true), delay);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setShowDelayed(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && showDelayed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={tweens.quickFade}
            className={cn('absolute z-50 whitespace-nowrap', positionStyles[position])}
          >
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: theme.surface,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                boxShadow: `0 0 12px ${theme.glow}30`,
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
