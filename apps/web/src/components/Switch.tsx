import { motion } from 'framer-motion';
import { springs } from '@/lib/animation-presets/presets';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const thumbOffsets = {
  sm: { off: 2, on: 18 },
  md: { off: 2, on: 22 },
  lg: { off: 2, on: 30 },
};

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
}: SwitchProps) {
  const sizes = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'h-3 w-3',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'h-5 w-5',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'h-6 w-6',
    },
  };

  const currentSize = sizes[size];
  const offset = thumbOffsets[size];

  return (
    <label
      className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}
    >
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        className={`relative inline-flex flex-shrink-0 ${currentSize.track} rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 hover:shadow-md ${
          checked ? 'bg-primary-600 hover:bg-primary-700' : 'bg-dark-600 hover:bg-dark-500'
        }`}
      >
        <motion.span
          className={`${currentSize.thumb} inline-block rounded-full bg-white shadow ring-0`}
          animate={{ x: checked ? offset.on : offset.off }}
          transition={springs.snappy}
          style={{ marginTop: '0.5px' }}
        />
      </motion.button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-white">{label}</span>}
          {description && <span className="text-xs text-gray-400 mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
}
