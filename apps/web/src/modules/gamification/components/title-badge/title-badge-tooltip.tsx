/**
 * TitleBadgeTooltip - Tooltip for title information
 *
 * Displays title name, description, rarity, category,
 * and unlock requirement on hover.
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Title, RARITY_COLORS } from '@/data/titles';

interface TitleBadgeTooltipProps {
  title: Title;
  rarityColor: (typeof RARITY_COLORS)[keyof typeof RARITY_COLORS];
}

/**
 * unknown for the gamification module.
 */
/**
 * Title Badge Tooltip component.
 */
export function TitleBadgeTooltip({ title, rarityColor }: TitleBadgeTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      className={cn(
        'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2',
        'rounded-lg px-3 py-2',
        'bg-dark-800/95 backdrop-blur-xl',
        'border border-white/10',
        'shadow-xl shadow-black/50',
        'whitespace-nowrap',
        'pointer-events-none'
      )}
    >
      <div className="text-center">
        <p className="text-sm font-semibold text-white">{title.name}</p>
        <p className="mt-0.5 text-xs text-gray-400">{title.description}</p>
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="text-xs font-medium capitalize" style={{ color: rarityColor.primary }}>
            {title.rarity}
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-xs capitalize text-gray-500">{title.category}</span>
        </div>
        {title.unlockRequirement && (
          <p className="mt-1 text-[10px] italic text-gray-500">{title.unlockRequirement}</p>
        )}
      </div>
      {/* Tooltip arrow */}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-dark-800/95" />
    </motion.div>
  );
}
