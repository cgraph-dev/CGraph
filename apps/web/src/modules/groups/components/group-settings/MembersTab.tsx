/**
 * MembersTab component - Full member management UI
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  ShieldCheckIcon,
  SpeakerXMarkIcon,
  NoSymbolIcon,
  ArrowRightStartOnRectangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { api } from '@/lib/api';
import { entranceVariants } from '@/lib/animation-presets/presets';
import type { MembersTabProps } from './types';

interface GroupMember {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  roles: Array<{ id: string; name: string; color: string }>;
  joinedAt: string;
  isMuted: boolean;
  mutedUntil: string | null;
}

interface GroupRole {
  id: string;
  name: string;
  color: string;
  position: number;
}

type MemberAction = 'none' | 'kick' | 'ban' | 'mute';

export function MembersTab({ groupId }: MembersTabProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ memberId: string; action: MemberAction }>({
    memberId: '',
    action: 'none',
  });
  const [banDuration, setBanDuration] = useState('permanent');
  const [availableRoles, setAvailableRoles] = useState<GroupRole[]>([]);
  const [roleModalMemberId, setRoleModalMemberId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await api.get(`/api/v1/groups/${groupId}/members`, { params });
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setMembers(
        data.map((m: Record<string, unknown>) => ({
          id: m.id as string,
          userId: (m.user_id ?? m.userId ?? m.id) as string,
          username: (m.username ?? (m.user as Record<string, unknown>)?.username ?? 'unknown') as string,
          displayName: (m.display_name ?? m.displayName ?? (m.user as Record<string, unknown>)?.display_name ?? null) as string | null,
          avatarUrl: (m.avatar_url ?? m.avatarUrl ?? (m.user as Record<string, unknown>)?.avatar_url ?? null) as string | null,
          role: (m.role ?? 'member') as string,
          roles: Array.isArray(m.roles) ? (m.roles as Array<{ id: string; name: string; color: string }>) : [],
          joinedAt: (m.joined_at ?? m.joinedAt ?? m.inserted_at ?? '') as string,
          isMuted: !!(m.is_muted ?? m.isMuted),
          mutedUntil: (m.muted_until ?? m.mutedUntil ?? null) as string | null,
        }))
      );
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [groupId, roleFilter]);

  useEffect(() => {
    fetchMembers();
    // Fetch available roles for role assignment
    api.get(`/api/v1/groups/${groupId}/roles`)
      .then((res) => {
        const roles = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        setAvailableRoles(
          roles.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            name: r.name as string,
            color: (r.color ?? '#808080') as string,
            position: (r.position ?? 0) as number,
          }))
        );
      })
      .catch(() => {});
  }, [fetchMembers, groupId]);

  const handleKick = async (memberId: string) => {
    try {
      await api.delete(`/api/v1/groups/${groupId}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      // Handle error
    }
    setConfirmAction({ memberId: '', action: 'none' });
  };

  const handleBan = async (memberId: string) => {
    try {
      const params: Record<string, string> = {};
      if (banDuration !== 'permanent') params.duration = banDuration;
      await api.post(`/api/v1/groups/${groupId}/members/${memberId}/ban`, params);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      // Handle error
    }
    setConfirmAction({ memberId: '', action: 'none' });
    setBanDuration('permanent');
  };

  const handleMute = async (memberId: string) => {
    try {
      await api.post(`/api/v1/groups/${groupId}/members/${memberId}/mute`);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, isMuted: true } : m))
      );
    } catch {
      // Handle error
    }
    setConfirmAction({ memberId: '', action: 'none' });
  };

  const handleUnmute = async (memberId: string) => {
    try {
      await api.delete(`/api/v1/groups/${groupId}/members/${memberId}/mute`);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, isMuted: false, mutedUntil: null } : m))
      );
    } catch {
      // Handle error
    }
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.username.toLowerCase().includes(q) ||
      (m.displayName?.toLowerCase().includes(q) ?? false)
    );
  });

  const roleColors: Record<string, string> = {
    owner: 'text-yellow-400 bg-yellow-400/10',
    admin: 'text-red-400 bg-red-400/10',
    moderator: 'text-blue-400 bg-blue-400/10',
    member: 'text-gray-400 bg-gray-400/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Members</h2>
        <p className="text-gray-400">
          Manage group members, roles, and moderation. {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-dark-800 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owners</option>
          <option value="admin">Admins</option>
          <option value="moderator">Moderators</option>
          <option value="member">Members</option>
        </select>
      </div>

      {/* Members List */}
      <GlassCard variant="frosted" className="divide-y divide-gray-700/50">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? 'No members match your search.' : 'No members found.'}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((member, index) => (
              <motion.div
                key={member.id}
                variants={entranceVariants.fadeUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.03 }}
                className="relative flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-dark-700">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {member.displayName || member.username}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[member.role] ?? roleColors.member}`}
                      >
                        {member.role}
                      </span>
                      {member.isMuted && (
                        <span className="rounded-full bg-orange-400/10 px-2 py-0.5 text-xs text-orange-400">
                          muted
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">@{member.username}</span>
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setOpenMenuId(openMenuId === member.id ? null : member.id)
                    }
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white"
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </motion.button>

                  <AnimatePresence>
                    {openMenuId === member.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-gray-700 bg-dark-800 shadow-xl"
                      >
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            const member2 = members.find((m2) => m2.id === member.id);
                            setSelectedRoleIds(new Set(member2?.roles.map((r) => r.id) ?? []));
                            setRoleModalMemberId(member.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700"
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                          Change Role
                        </button>
                        {member.isMuted ? (
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleUnmute(member.id);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-orange-400 hover:bg-dark-700"
                          >
                            <SpeakerXMarkIcon className="h-4 w-4" />
                            Unmute
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              setConfirmAction({ memberId: member.id, action: 'mute' });
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-orange-400 hover:bg-dark-700"
                          >
                            <SpeakerXMarkIcon className="h-4 w-4" />
                            Mute
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setConfirmAction({ memberId: member.id, action: 'kick' });
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-yellow-400 hover:bg-dark-700"
                        >
                          <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                          Kick
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            setConfirmAction({ memberId: member.id, action: 'ban' });
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-dark-700"
                        >
                          <NoSymbolIcon className="h-4 w-4" />
                          Ban
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </GlassCard>

      {/* Confirm Action Modal */}
      <AnimatePresence>
        {confirmAction.action !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmAction({ memberId: '', action: 'none' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-4 rounded-xl border border-gray-700 bg-dark-900 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">
                {confirmAction.action === 'kick' && 'Kick Member'}
                {confirmAction.action === 'ban' && 'Ban Member'}
                {confirmAction.action === 'mute' && 'Mute Member'}
              </h3>
              <p className="text-sm text-gray-400">
                {confirmAction.action === 'kick' && 'This member will be removed from the group. They can rejoin via invite.'}
                {confirmAction.action === 'ban' && 'This member will be banned. They cannot rejoin until unbanned.'}
                {confirmAction.action === 'mute' && 'This member will be muted for 10 minutes.'}
              </p>

              {confirmAction.action === 'ban' && (
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-dark-800 px-3 py-2 text-sm text-white"
                >
                  <option value="permanent">Permanent</option>
                  <option value="1h">1 Hour</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                </select>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmAction({ memberId: '', action: 'none' })}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (confirmAction.action === 'kick') handleKick(confirmAction.memberId);
                    else if (confirmAction.action === 'ban') handleBan(confirmAction.memberId);
                    else if (confirmAction.action === 'mute') handleMute(confirmAction.memberId);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                    confirmAction.action === 'ban'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmAction.action === 'kick'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  Confirm {confirmAction.action === 'kick' ? 'Kick' : confirmAction.action === 'ban' ? 'Ban' : 'Mute'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Assignment Modal */}
      <AnimatePresence>
        {roleModalMemberId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setRoleModalMemberId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md space-y-4 rounded-xl border border-gray-700 bg-dark-900 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">Assign Roles</h3>
              <p className="text-sm text-gray-400">
                Select the roles for {members.find((m) => m.id === roleModalMemberId)?.displayName || members.find((m) => m.id === roleModalMemberId)?.username}
              </p>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {availableRoles
                  .sort((a, b) => b.position - a.position)
                  .map((role) => (
                    <label
                      key={role.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-dark-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.has(role.id)}
                        onChange={() => {
                          setSelectedRoleIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(role.id)) {
                              next.delete(role.id);
                            } else {
                              next.add(role.id);
                            }
                            return next;
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600"
                      />
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-sm text-white">{role.name}</span>
                    </label>
                  ))}
                {availableRoles.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-500">No roles configured</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRoleModalMemberId(null)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!roleModalMemberId) return;
                    try {
                      await api.put(
                        `/api/v1/groups/${groupId}/members/${roleModalMemberId}/roles`,
                        { role_ids: Array.from(selectedRoleIds) }
                      );
                      // Refresh members list
                      fetchMembers();
                    } catch {
                      // Handle error
                    }
                    setRoleModalMemberId(null);
                  }}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Save Roles
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
