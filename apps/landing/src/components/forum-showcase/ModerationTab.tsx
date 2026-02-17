/**
 * ModerationTab Component
 * Tab content for moderation tools demo
 */

import { motion } from 'framer-motion';
import { moderationActions, moderationQueue } from './constants';
import { ForumNeonIcon } from './ForumNeonIcon';

export function ModerationTab() {
  return (
    <motion.div
      key="moderation"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <p className="text-sm text-gray-400">Powerful moderation tools to keep your community safe</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {moderationActions.map((action, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-gray-700/50 bg-gray-800/30 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ borderColor: 'rgba(16, 185, 129, 0.5)' }}
          >
            <ForumNeonIcon variant={action.icon} className="h-6 w-6" />
            <div>
              <h4 className="font-medium text-white">{action.title}</h4>
              <p className="text-sm text-gray-400">{action.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-medium text-white">Moderation Queue</h4>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
            {moderationQueue.length} pending
          </span>
        </div>
        <div className="space-y-2">
          {moderationQueue.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-400">
                {item.type}
              </span>
              <span className="text-gray-300">{item.item}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
