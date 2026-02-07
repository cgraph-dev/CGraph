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
      <div className="mt-6 rounded-xl border border-gray-700/50 bg-dark-800/50 p-8 text-center">
        <p className="text-sm text-gray-500">Notification settings coming soon</p>
      </div>
    </motion.div>
  );
}
