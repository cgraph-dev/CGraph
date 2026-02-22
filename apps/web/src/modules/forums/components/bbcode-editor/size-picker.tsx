/**
 * Size Picker Dropdown
 *
 * Dropdown for selecting font sizes in BBCode.
 */

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { FONT_SIZES } from './constants';
import type { SizePickerProps } from './types';

export function SizePicker({ isOpen, onToggle, onClose, onSelectSize }: SizePickerProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="rounded p-2 text-gray-400 transition-colors hover:bg-dark-600 hover:text-gray-200"
        title="Font Size"
      >
        <DocumentTextIcon className="h-4 w-4" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[100px] rounded-lg border border-dark-500 bg-dark-700 p-1 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => {
                onSelectSize(size.value);
                onClose();
              }}
              className="w-full rounded px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-dark-600"
            >
              {size.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
