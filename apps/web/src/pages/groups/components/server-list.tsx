/**
 * ServerList component
 * @module pages/groups
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  TicketIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { CreateGroupModal } from '@/modules/groups/components/group-list/create-group-modal';
import { useGroupStore } from '@/modules/groups/store';
import { GlassCard } from '@/shared/components/ui';
import type { ServerListProps } from './types';
import { ServerIcon } from './server-icon';
import { tweens, springs } from '@/lib/animation-presets';

/**
 * Server List component with create group and join-by-invite support.
 */
export function ServerList({ groups, activeGroupId }: ServerListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const { joinGroup } = useGroupStore();
  const navigate = useNavigate();

  const handleJoinByInvite = async () => {
    if (!inviteCode.trim()) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      // Extract code from full URL if pasted
      const code = inviteCode.trim().split('/').pop() || inviteCode.trim();
      await joinGroup(code);
      HapticFeedback.success();
      setShowJoinModal(false);
      setInviteCode('');
      navigate('/groups');
    } catch {
      setJoinError('Invalid or expired invite code');
      HapticFeedback.error();
    } finally {
      setIsJoining(false);
    }
  };
  return (
    <div className="relative z-10 flex w-[72px] flex-col items-center gap-2 overflow-y-auto border-r border-primary-500/20 bg-[rgb(30,32,40)]/[0.50] py-3 backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

      {/* Home/DMs button */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={springs.bouncy}
      >
        <NavLink to="/messages" onClick={() => HapticFeedback.medium()} className="group relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] transition-all duration-200 group-hover:rounded-xl group-hover:bg-primary-600"
            style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
          >
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-primary-600/20 opacity-0 blur-lg group-hover:opacity-100"
            transition={tweens.standard}
          />
        </NavLink>
      </motion.div>

      <div className="mx-auto h-0.5 w-8 rounded-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

      {/* Server list */}
      {groups.map((group) => (
        <motion.div
          key={group.id}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...springs.bouncy, delay: 0.1 }}
        >
          <ServerIcon group={group} isActive={group.id === activeGroupId} />
        </motion.div>
      ))}

      {/* Add server button */}
      <motion.button
        onClick={() => {
          HapticFeedback.medium();
          setShowCreateModal(true);
        }}
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Create new server"
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] transition-all duration-200 hover:rounded-xl hover:bg-gradient-to-br hover:from-green-600 hover:to-green-700"
        style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
      >
        <PlusIcon className="h-6 w-6 text-green-400 transition-colors group-hover:text-white" />
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-green-600/20 opacity-0 blur-lg group-hover:opacity-100"
          transition={tweens.standard}
        />
      </motion.button>

      {/* Join by invite button */}
      <motion.button
        onClick={() => {
          HapticFeedback.medium();
          setShowJoinModal(true);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Join server with invite"
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] transition-all duration-200 hover:rounded-xl hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700"
        style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
      >
        <TicketIcon className="h-6 w-6 text-blue-400 transition-colors group-hover:text-white" />
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-blue-600/20 opacity-0 blur-lg group-hover:opacity-100"
          transition={tweens.standard}
        />
      </motion.button>

      {/* Explore public groups */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <NavLink
          to="/groups/explore"
          onClick={() => HapticFeedback.medium()}
          aria-label="Explore public groups"
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] transition-all duration-200 hover:rounded-xl hover:bg-gradient-to-br hover:from-emerald-600 hover:to-teal-700"
          style={{ boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)' }}
        >
          <GlobeAltIcon className="h-6 w-6 text-emerald-400 transition-colors group-hover:text-white" />
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl bg-emerald-600/20 opacity-0 blur-lg group-hover:opacity-100"
            transition={tweens.standard}
          />
        </NavLink>
      </motion.div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>

      {/* Join by Invite Code Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard variant="crystal" glow className="p-6">
                <div className="mb-6 text-center">
                  <TicketIcon className="mx-auto mb-3 h-12 w-12 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Join a Server</h2>
                  <p className="mt-1 text-sm text-gray-400">Enter an invite link or code</p>
                </div>

                {joinError && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {joinError}
                  </div>
                )}

                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="https://cgraph.app/invite/abc123 or abc123"
                  className="mb-4 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinByInvite()}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 rounded-xl bg-white/[0.06] py-3 text-gray-300 transition-colors hover:bg-white/[0.10]"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoinByInvite}
                    disabled={!inviteCode.trim() || isJoining}
                    className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isJoining ? 'Joining...' : 'Join Server'}
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
