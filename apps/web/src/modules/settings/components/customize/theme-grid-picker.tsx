/**
 * ThemeGridPicker Component
 *
 * Grid-based theme/color picker with animated selection states,
 * glow effects, and hover previews.
 */

import { motion } from 'framer-motion';
import { CheckIcon, LockClosedIcon } from '@heroicons/react/24/solid';

export interface GridOption<T> {
  id: T;
  name: string;
  color?: string;
  colors?: string[];
  icon?: string;
  isPremium?: boolean;
  isLocked?: boolean;
  description?: string;
}

interface ThemeGridPickerProps<T> {
  options: GridOption<T>[];
  selected: T;
  onSelect: (id: T) => void;
  columns?: 4 | 6 | 8;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showLockIcon?: boolean;
  className?: string;
  allowPreview?: boolean; // Allow selecting locked items for preview
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const columnClasses = {
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  8: 'grid-cols-8',
};

export default function ThemeGridPicker<T extends string>({
  options,
  selected,
  onSelect,
  columns = 6,
  size = 'md',
  showLabels = false,
  showLockIcon = true,
  className = '',
  allowPreview = true,
}: ThemeGridPickerProps<T>) {
  return (
    <div className={`grid ${columnClasses[columns]} gap-2 ${className}`}>
      {options.map((option) => {
        const isSelected = selected === option.id;
        const isLocked = option.isLocked && !allowPreview;
        const gradient = option.colors?.length
          ? `linear-gradient(135deg, ${option.colors.join(', ')})`
          : option.color;

        return (
          <motion.button
            key={option.id}
            onClick={() => !isLocked && onSelect(option.id)}
            className={`relative ${sizeClasses[size]} group overflow-hidden rounded-lg transition-all duration-200 ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-900' : ''} `}
            style={{ background: gradient }}
            whileHover={!isLocked ? { scale: 1.1, zIndex: 10 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Glow effect on selection */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  boxShadow: `0 0 20px ${option.colors?.[0] || option.color}, 0 0 40px ${option.colors?.[0] || option.color}40`,
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {/* Check icon for selected */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]"
              >
                <CheckIcon className="h-5 w-5 text-white drop-shadow-lg" />
              </motion.div>
            )}

            {/* Lock icon for locked items */}
            {option.isLocked && showLockIcon && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <LockClosedIcon className="h-4 w-4 text-white/70" />
              </div>
            )}

            {/* Icon overlay */}
            {option.icon && !isSelected && !option.isLocked && (
              <div className="absolute inset-0 flex items-center justify-center text-lg">
                {option.icon}
              </div>
            )}

            {/* Hover tooltip */}
            <div className="pointer-events-none absolute -bottom-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded border border-white/10 bg-dark-800 px-2 py-1 text-xs text-white shadow-lg">
                {option.name}
                {option.isLocked && ' 🔒'}
              </div>
            </div>
          </motion.button>
        );
      })}

      {/* Labels row if enabled */}
      {showLabels && (
        <div className={`col-span-full grid ${columnClasses[columns]} mt-1 gap-2`}>
          {options.map((option) => (
            <div key={`label-${option.id}`} className="truncate text-center text-xs text-gray-400">
              {option.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Preset color options for common use cases
export const THEME_COLOR_OPTIONS: GridOption<string>[] = [
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'purple', name: 'Purple', color: '#8b5cf6' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
  { id: 'orange', name: 'Orange', color: '#f97316' },
  { id: 'pink', name: 'Pink', color: '#ec4899' },
  { id: 'gold', name: 'Gold', color: '#eab308' },
  { id: 'crimson', name: 'Crimson', color: '#dc2626' },
  { id: 'arctic', name: 'Arctic', color: '#38bdf8' },
];

export const EFFECT_OPTIONS: GridOption<string>[] = [
  { id: 'glassmorphism', name: 'Glass', icon: '🪟' },
  { id: 'neon', name: 'Neon', icon: '💡' },
  { id: 'holographic', name: 'Holo', icon: '🌈' },
  { id: 'minimal', name: 'Minimal', icon: '◻️' },
  { id: 'aurora', name: 'Aurora', icon: '🌌' },
  { id: 'cyberpunk', name: 'Cyber', icon: '🤖' },
];
