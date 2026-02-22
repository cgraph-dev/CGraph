/**
 * Slider Component
 *
 * Range slider with label and value display.
 */

import type { SliderProps } from './types';

// =============================================================================
// COMPONENT
// =============================================================================

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  displayValue,
  icon,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-300">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="font-mono text-sm text-primary-400">
          {displayValue ?? value.toFixed(1)}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-dark-700">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default Slider;
