/**
 * RangeSliderControl Component
 *
 * Styled range slider with dynamic gradient fill,
 * value display, and theme-aware coloring.
 */

import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';

interface RangeSliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  color?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
}

export default function RangeSliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  color = '#10b981',
  showValue = true,
  disabled = false,
  className = '',
  description,
}: RangeSliderControlProps) {
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and value display */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        {showValue && (
          <motion.span
            className="rounded px-2 py-0.5 font-mono text-sm"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
          >
            {value}
            {unit}
          </motion.span>
        )}
      </div>

      {/* Description */}
      {description && <p className="text-xs text-gray-500">{description}</p>}

      {/* Slider container */}
      <div className="relative flex h-6 items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 overflow-hidden rounded-full bg-dark-700">
          {/* Filled portion */}
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color}80, ${color})`,
              boxShadow: isDragging ? `0 0 10px ${color}60` : 'none',
            }}
            animate={{
              opacity: disabled ? 0.5 : 1,
            }}
          />
        </div>

        {/* Native range input (invisible, for accessibility) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />

        {/* Custom thumb */}
        <motion.div
          className="pointer-events-none absolute h-5 w-5 rounded-full border-2"
          style={{
            left: `calc(${percentage}% - 10px)`,
            backgroundColor: color,
            borderColor: 'white',
            boxShadow: `0 0 ${isDragging ? '15px' : '8px'} ${color}80`,
          }}
          animate={{
            scale: isDragging ? 1.2 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact version of the slider for inline use
 */
export function CompactSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  color = '#10b981',
  disabled = false,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  color?: string;
  disabled?: boolean;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative flex h-4 flex-1 items-center">
      <div className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-dark-700">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <div
        className="pointer-events-none absolute h-3 w-3 rounded-full border border-white transition-all"
        style={{
          left: `calc(${percentage}% - 6px)`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
