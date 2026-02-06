/**
 * MembersTab component
 * @module modules/groups/components/group-settings
 */

import { motion } from 'framer-motion';
import type { MembersTabProps } from './types';

export function MembersTab({ groupId: _groupId }: MembersTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="mb-4 text-2xl font-bold text-white">Members</h2>
      <p className="text-gray-400">Manage group members and their roles.</p>
      {/* TODO: Implement member management */}
    </motion.div>
  );
}
