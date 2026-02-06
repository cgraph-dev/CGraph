/**
 * AttachmentsPreview component - shows selected file attachments
 */

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface AttachmentsPreviewProps {
  attachments: File[];
  onRemove: (index: number) => void;
}

export function AttachmentsPreview({ attachments, onRemove }: AttachmentsPreviewProps) {
  return (
    <AnimatePresence>
      {attachments.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap gap-2 rounded-t-xl bg-dark-800/30 px-4 py-2">
            {attachments.map((file, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="group relative"
              >
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-dark-700">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemove(index)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <XMarkIcon className="h-3 w-3" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
