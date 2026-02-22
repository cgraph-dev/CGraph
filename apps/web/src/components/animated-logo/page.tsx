/**
 * AnimatedLogo component
 * Main export that wraps CircuitBoardLogo with text and effects
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { AnimatedLogoProps } from './types';
import { SIZE_MAP, COLOR_PALETTES, SPLASH_TIMINGS } from './constants';
import { CircuitBoardLogo } from './circuit-board-logo';

export default function AnimatedLogo({
  size = 'md',
  showText = true,
  variant = 'default',
  onAnimationComplete,
  color = 'default',
}: AnimatedLogoProps) {
  const [textVisible, setTextVisible] = useState(variant !== 'splash');
  const dimensions = SIZE_MAP[size] ?? SIZE_MAP['md']!;
  const c = COLOR_PALETTES[color] ?? COLOR_PALETTES['default']!;

  useEffect(() => {
    if (variant === 'splash') {
      const timer = setTimeout(() => setTextVisible(true), SPLASH_TIMINGS.textAppear);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [variant]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Logo Container with optional glow backdrop */}
      <div className="relative">
        {/* Ambient glow behind logo */}
        {(variant === 'splash' || variant === 'hero') && (
          <motion.div
            className="absolute inset-0 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${c.primary}20 0%, transparent 70%)`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.5 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        )}

        <CircuitBoardLogo
          logoSize={dimensions.logo}
          isAnimated={variant === 'default'}
          isLoading={variant === 'loading'}
          isSplash={variant === 'splash'}
          color={color}
          onAnimationComplete={onAnimationComplete}
        />
      </div>

      {/* Text with animation */}
      {showText && (
        <AnimatePresence>
          {textVisible && (
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.span
                className={`font-bold ${dimensions.text} tracking-tight`}
                style={{
                  background: `linear-gradient(135deg, ${c.primary}, ${c.secondary}, ${c.tertiary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                CGraph
              </motion.span>
              {variant === 'splash' && (
                <motion.span
                  className="mt-1 text-sm text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Secure • Connected • Decentralized
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
