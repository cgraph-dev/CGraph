/**
 * DangerTab component
 * @module modules/groups/components/group-settings
 */

import { motion } from 'framer-motion';
import { ArrowRightOnRectangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { DangerTabProps } from './types';

/**
 * unknown for the groups module.
 */
/**
 * Danger Tab component.
 */
export function DangerTab({ isOwner, onLeave, onDelete }: DangerTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl"
    >
      <h2 className="mb-2 text-2xl font-bold text-red-400">Danger Zone</h2>
      <p className="mb-6 text-gray-400">
        These actions are irreversible. Please proceed with caution.
      </p>

      <div className="space-y-4">
        <GlassCard variant="frosted" className="border border-red-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Leave Group</h3>
              <p className="text-sm text-gray-400">You will need an invite to rejoin.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLeave}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-red-400 hover:bg-red-500/20"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Leave
            </motion.button>
          </div>
        </GlassCard>

        {isOwner && (
          <GlassCard variant="frosted" className="border border-red-500/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Delete Group</h3>
                <p className="text-sm text-gray-400">
                  Permanently delete this group and all its data.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDelete}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
              >
                <TrashIcon className="h-5 w-5" />
                Delete
              </motion.button>
            </div>
          </GlassCard>
        )}
      </div>
    </motion.div>
  );
}
