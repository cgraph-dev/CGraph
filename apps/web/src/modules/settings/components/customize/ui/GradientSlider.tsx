/**
 * Gradient slider component with range input
 * @module modules/settings/components/customize/ui
 */

import { memo } from 'react';

import { THEME_COLORS as themeColors } from '@/stores/customization';

import type { GradientSliderProps } from './types';

export const GradientSlider = memo(function GradientSlider({
  value,
  min,
  max,
  onChange,
  colorPreset = 'emerald',
  label,
  showValue = true,
  suffix = '',
}: GradientSliderProps) {
  const colors = themeColors[colorPreset];
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && <span className="text-sm text-white/70">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-white">
              {value}
              {suffix}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-700"
          style={{
            background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
          }}
        />
        <style>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          }
          input[type='range']::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>
    </div>
  );
});
