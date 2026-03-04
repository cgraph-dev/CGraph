/**
 * NotificationsStep component - notification preferences
 */

import { motion } from 'motion/react';
import { containerVariants, itemVariants } from './animations';
import { NOTIFICATION_OPTIONS } from './constants';
import type { ProfileData, NotificationKey } from './types';

interface NotificationsStepProps {
  profileData: ProfileData;
  onToggle: (key: NotificationKey) => void;
}

/**
 * unknown for the auth module.
 */
/**
 * Notifications Step component.
 */
export function NotificationsStep({ profileData, onToggle }: NotificationsStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {NOTIFICATION_OPTIONS.map(({ key, label, desc }) => (
        <motion.div
          key={key}
          variants={itemVariants}
          className="flex items-center justify-between rounded-xl border border-dark-600 bg-dark-800/30 p-4 transition-colors hover:border-dark-500"
        >
          <div>
            <h4 className="font-medium text-white">{label}</h4>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>
          <button
            type="button"
            onClick={() => onToggle(key)}
            className={`relative h-6 w-12 rounded-full transition-colors duration-200 ${
              profileData[key] ? 'bg-primary-500' : 'bg-dark-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                profileData[key] ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}
