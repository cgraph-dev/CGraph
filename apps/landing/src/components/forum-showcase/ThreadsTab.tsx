/**
 * ThreadsTab Component
 * Tab content for thread prefixes demo
 */

import { motion } from 'framer-motion';
import { threadPrefixes, sampleThreads } from './constants';
import { ForumNeonIcon } from './ForumNeonIcon';

export function ThreadsTab() {
  return (
    <motion.div
      key="threads"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <p className="text-sm text-gray-400">
        Organize threads with customizable prefixes and status badges
      </p>

      <div className="flex flex-wrap gap-2">
        {threadPrefixes.map((prefix) => (
          <motion.span
            key={prefix.name}
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: prefix.bg, color: prefix.color }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {prefix.name}
          </motion.span>
        ))}
      </div>

      <div className="space-y-3">
        {sampleThreads.map((thread, i) => {
          const prefixData = threadPrefixes.find((p) => p.name === thread.prefix);
          return (
            <motion.div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-800/30 p-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: prefixData?.bg, color: prefixData?.color }}
              >
                {thread.prefix}
              </span>
              <span className="flex-1 truncate text-white">{thread.title}</span>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <ForumNeonIcon variant="chat" className="h-3.5 w-3.5" color="currentColor" />
                  <span>{thread.replies}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ForumNeonIcon variant="eye" className="h-3.5 w-3.5" color="currentColor" />
                  <span>{thread.views}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
