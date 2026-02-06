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
      {/* TODO: Implement channel management */}
    </motion.div>
  );
}
