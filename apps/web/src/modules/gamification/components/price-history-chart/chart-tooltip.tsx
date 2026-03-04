/**
 * ChartTooltip - floating tooltip on hover
 */
import { motion, AnimatePresence } from 'motion/react';
import type { HoveredPointData, ChartDimensions } from './types';
import { CURRENCY_ICONS } from './constants';

interface ChartTooltipProps {
  hoveredPoint: HoveredPointData | null;
  dimensions: ChartDimensions;
  currency: 'coins' | 'gems';
}

/**
 * unknown for the gamification module.
 */
/**
 * Chart Tooltip component.
 */
export function ChartTooltip({ hoveredPoint, dimensions, currency }: ChartTooltipProps) {
  return (
    <AnimatePresence>
      {hoveredPoint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-10 rounded-lg border border-white/10 bg-[rgb(30,32,40)] p-3 shadow-xl"
          style={{
            left: Math.min(hoveredPoint.x - 60, dimensions.width - 140),
            top: hoveredPoint.y - 80,
          }}
        >
          <p className="text-sm font-bold text-white">
            {hoveredPoint.point.price.toLocaleString()} {CURRENCY_ICONS[currency]}
          </p>
          <p className="text-xs text-gray-500">
            {hoveredPoint.point.timestamp.toLocaleDateString()}{' '}
            {hoveredPoint.point.timestamp.toLocaleTimeString()}
          </p>
          {hoveredPoint.point.volume && (
            <p className="mt-1 text-xs text-gray-400">Vol: {hoveredPoint.point.volume}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
