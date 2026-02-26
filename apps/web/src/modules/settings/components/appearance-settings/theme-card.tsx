/**
 * Theme Card Component
 *
 * Visual theme preview card with selection and delete actions.
 */

import { durations } from '@cgraph/animation-constants';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useReducedMotion } from '@/contexts/theme-context-enhanced';

import type { ThemeCardProps } from './types';
import { tweens, loop } from '@/lib/animation-presets';

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * unknown for the settings module.
 */
/**
 * Theme Card display component.
 */
export function ThemeCard({ theme, isActive, onSelect, onDelete, isPremium }: ThemeCardProps) {
  const reduceMotion = useReducedMotion();

  const previewColors = useMemo(
    () => ({
      bg: theme.colors.background,
      surface: theme.colors.surface,
      primary: theme.colors.primary,
      accent: theme.colors.accent,
      text: theme.colors.textPrimary,
      border: theme.colors.surfaceBorder,
      holoPrimary: theme.colors.holoPrimary,
      holoGlow: theme.colors.holoGlow,
    }),
    [theme]
  );

  const isMatrix = theme.id === 'matrix';
  const isHolographic = theme.category === 'special';

  return (
    <motion.button
      onClick={onSelect}
      whileHover={reduceMotion ? {} : { scale: 1.02, y: -2 }}
      whileTap={reduceMotion ? {} : { scale: 0.98 }}
      className={`relative w-full rounded-xl p-1 transition-all duration-300 ${
        isActive
          ? 'shadow-lg shadow-primary-500/20 ring-2 ring-primary-500'
          : 'ring-1 ring-dark-600 hover:ring-dark-500'
      } `}
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${previewColors.primary}20, ${previewColors.accent}20)`
          : undefined,
      }}
    >
      {/* Theme Preview */}
      <div
        className="relative h-24 overflow-hidden rounded-lg"
        style={{ background: previewColors.bg }}
      >
        {/* Matrix Effect */}
        {isMatrix && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute font-mono text-xs"
                  style={{
                    left: `${i * 10 + 5}%`,
                    color: previewColors.primary,
                    textShadow: `0 0 5px ${previewColors.holoGlow}`,
                  }}
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          y: ['-100%', '200%'],
                        }
                  }
                  transition={{
                    duration: durations.cinematic.ms / 1000 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: 'linear',
                  }}
                >
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j}>{String.fromCharCode(0x30a0 + Math.random() * 96)}</div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Holographic Scanlines */}
        {isHolographic && theme.animations.enableScanlines && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                ${previewColors.holoPrimary}05 2px,
                ${previewColors.holoPrimary}05 4px
              )`,
            }}
            animate={reduceMotion ? {} : { y: [0, 4] }}
            transition={loop(tweens.instant)}
          />
        )}

        {/* UI Mock */}
        <div className="relative flex h-full flex-col gap-1 p-2">
          {/* Header */}
          <div className="h-3 rounded" style={{ background: previewColors.surface }} />

          {/* Content */}
          <div className="flex flex-1 gap-1">
            {/* Sidebar */}
            <div className="w-6 rounded" style={{ background: previewColors.surface }} />

            {/* Main content */}
            <div className="flex flex-1 flex-col gap-1">
              {/* Message bubbles */}
              <div
                className="h-2 w-3/4 rounded"
                style={{
                  background: previewColors.primary,
                  boxShadow: isHolographic ? `0 0 8px ${previewColors.holoGlow}` : undefined,
                }}
              />
              <div
                className="h-2 w-1/2 self-end rounded"
                style={{ background: previewColors.surface }}
              />
              <div
                className="h-2 w-2/3 rounded"
                style={{ background: previewColors.primary }}
              ></div>
            </div>
          </div>
        </div>

        {/* Glow effect for holographic themes */}
        {isHolographic && (
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              boxShadow: `inset 0 0 30px ${previewColors.holoGlow}30`,
            }}
          />
        )}

        {/* Active indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500"
            >
              <CheckIcon className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium badge */}
        {isPremium && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
            <SparklesIcon className="h-2.5 w-2.5" />
            PRO
          </div>
        )}
      </div>

      {/* Theme info */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="text-left">
          <h4 className="truncate text-sm font-medium text-white">{theme.name}</h4>
          <p className="text-xs capitalize text-gray-400">{theme.category}</p>
        </div>

        {/* Delete button for custom themes */}
        {!theme.isBuiltIn && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 transition-colors hover:text-red-400"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.button>
  );
}

export default ThemeCard;
