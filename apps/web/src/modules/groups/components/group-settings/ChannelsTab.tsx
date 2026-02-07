/**
 * ChannelsTab component
 * @module modules/groups/components/group-settings
 */

import { motion } from 'framer-motion';
import type { ChannelsTabProps } from './types';

export function ChannelsTab({ groupId: _groupId }: ChannelsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="mb-4 text-2xl font-bold text-white">Channels</h2>
      <p className="text-gray-400">Manage channels and categories.</p>
      <div className="mt-6 rounded-xl border border-gray-700/50 bg-dark-800/50 p-8 text-center">
        <p className="text-sm text-gray-500">Channel management coming soon</p>
      </div>
    </motion.div>
  );
}
