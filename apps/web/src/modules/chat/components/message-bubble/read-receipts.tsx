/**
 * Read Receipts Component
 *
 * Displays avatars of users who have read the message.
 */

import { motion } from 'framer-motion';
import type { ReadByEntry } from './types';
import { tweens } from '@/lib/animation-presets';

interface ReadReceiptsProps {
  readBy: ReadByEntry[];
}

export function ReadReceipts({ readBy }: ReadReceiptsProps) {
  return (
    <motion.div
      className="mt-1 flex items-center gap-1 px-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={tweens.standard}
    >
      <div className="flex -space-x-1">
        {readBy.slice(0, 3).map((reader, idx) => (
          <motion.div
            key={reader.id || reader.userId}
            className="h-4 w-4 overflow-hidden rounded-full border border-dark-900 bg-gradient-to-br from-primary-500 to-purple-600"
            initial={{ scale: 0, x: -10 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            title={`Read by ${reader.username || 'User'}`}
          >
            {reader.avatarUrl ? (
              <img
                src={reader.avatarUrl}
                alt={reader.username || 'User'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-white">
                {(reader.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
        ))}
      </div>
      {readBy.length > 3 && (
        <span className="text-[10px] font-medium text-gray-500">+{readBy.length - 3}</span>
      )}
      <span className="text-[10px] text-gray-500">Seen</span>
    </motion.div>
  );
}
