/**
 * AnimatedToggle Component
 *
 * Toggle switch with gradient background, smooth animations,
 * and theme-aware styling.
 */

import { motion } from 'framer-motion';
import { springs } from '@/lib/animation-presets/presets';

interface AnimatedToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

const sizeConfig = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 16, text: 'text-xs' },
  md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 20, text: 'text-sm' },
  lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 28, text: 'text-base' },
};

export default function AnimatedToggle({
  label,
  description,
  checked,
  onChange,
  color = '#10b981',
  disabled = false,
  size = 'md',
  className = '',
  icon,
}: AnimatedToggleProps) {
  const config = sizeConfig[size];

  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className} `}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {icon && <span className="flex-shrink-0 text-gray-400">{icon}</span>}
        <div className="min-w-0">
          <span className={`font-medium text-gray-200 ${config.text}`}>{label}</span>
          {description && <p className="truncate text-xs text-gray-500">{description}</p>}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative flex-shrink-0 ${config.track} rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 ${checked ? '' : 'bg-dark-600'} `}
        style={{
          backgroundColor: checked ? color : undefined,
          boxShadow: checked ? `0 0 12px ${color}60` : 'none',
        }}
      >
        {/* Track gradient overlay when on */}
        {checked && (
          <motion.div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: `linear-gradient(135deg, transparent, ${color}40)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
          />
        )}

        {/* Thumb */}
        <motion.div
          className={` ${config.thumb} flex items-center justify-center rounded-full bg-white shadow-md`}
          initial={false}
          animate={{
            x: checked ? config.translate : 2,
            scale: 1,
          }}
          whileTap={{ scale: 0.9 }}
          transition={springs.snappy}
        >
          {/* Checkmark or X indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[8px]"
          >
            {checked ? (
              <svg
                className="h-2.5 w-2.5"
                viewBox="0 0 12 12"
                fill="none"
                stroke={color}
                strokeWidth="2"
              >
                <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg
                className="h-2 w-2"
                viewBox="0 0 12 12"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
              >
                <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
              </svg>
            )}
          </motion.div>
        </motion.div>
      </button>
    </label>
  );
}

/**
 * Toggle group for related options
 */
export function ToggleGroup({
  children,
  title,
  className = '',
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="text-sm font-medium uppercase tracking-wider text-gray-400">{title}</h4>
      )}
      <div className="space-y-2 rounded-xl border border-white/5 bg-dark-800/50 p-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Compact toggle for inline use
 */
export function CompactToggle({
  checked,
  onChange,
  color = '#10b981',
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${checked ? '' : 'bg-dark-600'} `}
      style={{
        backgroundColor: checked ? color : undefined,
      }}
    >
      <motion.div
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
        animate={{ x: checked ? 18 : 2 }}
        transition={springs.snappy}
      />
    </button>
  );
}
