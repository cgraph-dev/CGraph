/**
 * AttachmentMenu component - dropdown menu for attachment options
 */

import { motion, AnimatePresence } from 'motion/react';
import { PlusCircleIcon, PhotoIcon, DocumentIcon, GifIcon } from '@heroicons/react/24/outline';
import type { AttachmentMode } from './types';

interface AttachmentMenuProps {
  attachmentMode: AttachmentMode;
  onToggle: (mode: AttachmentMode) => void;
  onFileSelect: () => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Attachment Menu component.
 */
export function AttachmentMenu({ attachmentMode, onToggle, onFileSelect }: AttachmentMenuProps) {
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggle('file')}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
      >
        <PlusCircleIcon className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {attachmentMode === 'file' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 rounded-xl border border-gray-700 bg-dark-800 p-2 shadow-xl"
          >
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onFileSelect}
                className="rounded-xl bg-blue-500/20 p-3 text-blue-400 hover:bg-blue-500/30"
              >
                <PhotoIcon className="h-6 w-6" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onFileSelect}
                className="rounded-xl bg-green-500/20 p-3 text-green-400 hover:bg-green-500/30"
              >
                <DocumentIcon className="h-6 w-6" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggle('gif')}
                className="rounded-xl bg-purple-500/20 p-3 text-purple-400 hover:bg-purple-500/30"
              >
                <GifIcon className="h-6 w-6" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
