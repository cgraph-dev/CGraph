/**
 * Scanlines Component
 * CRT-style scanline overlay effect
 */

import { motion } from 'framer-motion';
import {
  DEFAULT_SCANLINE_OPACITY,
  DEFAULT_SCANLINE_SPEED,
  DEFAULT_SCANLINE_COLOR,
} from './constants';
import type { ScanlineProps } from './types';

export function Scanlines({
  opacity = DEFAULT_SCANLINE_OPACITY,
  speed = DEFAULT_SCANLINE_SPEED,
  color = DEFAULT_SCANLINE_COLOR,
}: ScanlineProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Static scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, ${opacity}) 2px,
            rgba(0, 0, 0, ${opacity}) 4px
          )`,
        }}
      />
      {/* Moving scanline */}
      <motion.div
        className="absolute inset-x-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, transparent, ${color}30, transparent)`,
        }}
        animate={{ y: ['0vh', '100vh'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
