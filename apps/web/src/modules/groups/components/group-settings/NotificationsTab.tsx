/**
 * NotificationsTab component
 * @module modules/groups/components/group-settings
 */

import { motion } from 'framer-motion';

export function NotificationsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="mb-4 text-2xl font-bold text-white">Notifications</h2>
      <p className="text-gray-400">Configure notification preferences for this group.</p>
      {/* TODO: Implement notification settings */}
    </motion.div>
  );
}
