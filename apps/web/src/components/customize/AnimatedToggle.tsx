/**
 * AnimatedToggle Component
 * 
 * Toggle switch with gradient background, smooth animations,
 * and theme-aware styling.
 */

import { motion } from 'framer-motion';

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
      className={`
        flex items-center justify-between gap-3 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
        <div className="min-w-0">
          <span className={`font-medium text-gray-200 ${config.text}`}>{label}</span>
          {description && (
            <p className="text-xs text-gray-500 truncate">{description}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative flex-shrink-0 ${config.track} rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900
          ${checked ? '' : 'bg-dark-600'}
        `}
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
          className={`
            ${config.thumb} rounded-full bg-white shadow-md
            flex items-center justify-center
          `}
          initial={false}
          animate={{
            x: checked ? config.translate : 2,
            scale: 1,
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {/* Checkmark or X indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[8px]"
          >
            {checked ? (
              <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2">
                <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none" stroke="#6b7280" strokeWidth="2">
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
        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </h4>
      )}
      <div className="space-y-2 bg-dark-800/50 rounded-xl p-4 border border-white/5">
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
      className={`
        relative w-9 h-5 rounded-full transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? '' : 'bg-dark-600'}
      `}
      style={{
        backgroundColor: checked ? color : undefined,
      }}
    >
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
