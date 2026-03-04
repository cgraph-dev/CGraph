/**
 * Active invites management tab component.
 * @module
 */
import { motion } from 'motion/react';
import {
  LinkIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import type { Invite } from './useInviteManager';

interface InviteManageTabProps {
  invites: Invite[];
  onCopyLink: (link: string) => void;
  onDeleteInvite: (id: string) => void;
  formatExpiration: (expiresAt: string | null) => string;
}

/**
 * unknown for the groups module.
 */
/**
 * Invite Manage Tab component.
 */
export function InviteManageTab({
  invites,
  onCopyLink,
  onDeleteInvite,
  formatExpiration,
}: InviteManageTabProps) {
  return (
    <motion.div
      key="manage"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-3"
    >
      {invites.length === 0 ? (
        <div className="py-8 text-center">
          <LinkIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">No active invites</p>
        </div>
      ) : (
        invites.map((invite) => (
          <motion.div
            key={invite.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-gray-700 bg-dark-800 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-primary-400">{invite.code}</code>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onCopyLink(invite.url)}
                    className="rounded p-1 hover:bg-dark-700"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 text-gray-400" />
                  </motion.button>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="h-3 w-3" />
                    {invite.uses}
                    {invite.maxUses ? ` / ${invite.maxUses}` : ''} uses
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {formatExpiration(invite.expiresAt)}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-500">Created by {invite.createdBy.username}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDeleteInvite(invite.id)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
              >
                <TrashIcon className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
