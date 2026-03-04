/**
 * Post editor formatting toolbar component.
 * @module
 */
import { motion } from 'motion/react';
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { TOOLBAR_BUTTONS } from './constants';
import type { EditorToolbarProps } from './types';

/**
 * EditorToolbar Component
 *
 * Formatting toolbar with markdown shortcuts and write/preview toggle
 */
export function EditorToolbar({ isPreview, setIsPreview, onInsertFormatting }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] bg-white/[0.04] p-2">
      {TOOLBAR_BUTTONS.map((button, index) =>
        button.tag === 'divider' ? (
          <div key={index} className="mx-1 h-6 w-px bg-white/[0.08]" />
        ) : (
          <motion.button
            key={button.tag}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onInsertFormatting(button.tag)}
            className="rounded p-2 text-gray-400 transition-colors hover:bg-white/[0.10] hover:text-white"
            title={button.label}
          >
            {button.icon && <button.icon className="h-4 w-4" />}
          </motion.button>
        )
      )}

      <div className="flex-1" />

      {/* View Toggle */}
      <div className="flex items-center rounded-lg bg-white/[0.06] p-0.5">
        <button
          onClick={() => setIsPreview(false)}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
            !isPreview ? 'bg-white/[0.08] text-white' : 'text-gray-400'
          }`}
        >
          <PencilSquareIcon className="h-4 w-4" />
          Write
        </button>
        <button
          onClick={() => setIsPreview(true)}
          className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
            isPreview ? 'bg-white/[0.08] text-white' : 'text-gray-400'
          }`}
        >
          <EyeIcon className="h-4 w-4" />
          Preview
        </button>
      </div>
    </div>
  );
}

export default EditorToolbar;
