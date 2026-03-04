/**
 * Color Picker Dropdown
 *
 * Dropdown for selecting text colors in BBCode.
 */

import { SwatchIcon } from '@heroicons/react/24/outline';
import { COLORS } from './constants';
import type { ColorPickerProps } from './types';

/**
 * unknown for the forums module.
 */
/**
 * Color Picker component.
 */
export function ColorPicker({ isOpen, onToggle, onClose, onSelectColor }: ColorPickerProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="rounded p-2 text-gray-400 transition-colors hover:bg-white/[0.10] hover:text-gray-200"
        title="Text Color"
      >
        <SwatchIcon className="h-4 w-4" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 grid grid-cols-5 gap-1 rounded-lg border border-dark-500 bg-white/[0.06] p-2 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => {
                onSelectColor(color.value);
                onClose();
              }}
              className="h-6 w-6 rounded border border-dark-400 transition-transform hover:scale-110"
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
