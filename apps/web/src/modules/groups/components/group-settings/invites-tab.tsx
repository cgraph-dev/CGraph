/**
 * InvitesTab component
 * @module modules/groups/components/group-settings
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InviteModal } from '../invite-modal';
import type { InvitesTabProps } from './types';

/**
 * unknown for the groups module.
 */
/**
 * Invites Tab component.
 */
export function InvitesTab({ groupId, groupName }: InvitesTabProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Invites</h2>
          <p className="text-gray-400">Manage invitation links for your group.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white"
        >
          Create Invite
        </motion.button>
      </div>

      <AnimatePresence>
        {showModal && (
          <InviteModal
            groupId={groupId}
            groupName={groupName}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
