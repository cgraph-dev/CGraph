/**
 * UI Control Components
 * @module modules/settings/components/ui-customization
 */

import { motion } from 'motion/react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { springs } from '@/lib/animation-presets';

// =============================================================================
// COLOR PICKER
// =============================================================================

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Color Picker component.
 */
export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-20 cursor-pointer rounded-lg border-2 border-white/[0.08]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 font-mono text-sm text-white"
        />
      </div>
    </div>
  );
}

// =============================================================================
// SLIDER CONTROL
// =============================================================================

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}

/**
 * unknown for the settings module.
 */
/**
 * Slider Control component.
 */
export function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: SliderControlProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm font-semibold text-primary-400">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/[0.06]"
      />
    </div>
  );
}

// =============================================================================
// SELECT
// =============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

/**
 * unknown for the settings module.
 */
/**
 * Select component.
 */
export function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-white transition-colors focus:border-primary-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// =============================================================================
// TOGGLE
// =============================================================================

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Toggle component.
 */
export function Toggle({ label, description, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/[0.08]/30">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="mt-0.5 text-xs text-gray-500">{description}</div>}
      </div>
      <motion.button
        onClick={() => {
          onChange(!value);
          HapticFeedback.light();
        }}
        className={`relative h-6 w-12 rounded-full transition-colors ${
          value ? 'bg-primary-600' : 'bg-white/[0.08]'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white"
          animate={{ x: value ? 24 : 0 }}
          transition={springs.snappy}
        />
      </motion.button>
    </div>
  );
}
