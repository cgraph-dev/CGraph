/**
 * Smilies Picker Dropdown
 *
 * Dropdown for inserting emoji/smilies.
 */

import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { SMILIES } from './constants';
import type { SmiliesPickerProps } from './types';

/**
 * unknown for the forums module.
 */
/**
 * Smilies Picker component.
 */
export function SmiliesPicker({ isOpen, onToggle, onClose, onSelectSmiley }: SmiliesPickerProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="rounded p-2 text-gray-400 transition-colors hover:bg-dark-600 hover:text-gray-200"
        title="Insert Emoji"
      >
        <FaceSmileIcon className="h-4 w-4" />
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 grid grid-cols-5 gap-1 rounded-lg border border-dark-500 bg-dark-700 p-2 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {SMILIES.map((smiley) => (
            <button
              key={smiley.code}
              type="button"
              onClick={() => {
                onSelectSmiley(smiley.emoji);
                onClose();
              }}
              className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-dark-600"
              title={smiley.code}
            >
              {smiley.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
