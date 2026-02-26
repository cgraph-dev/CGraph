/**
 * MembersTab component - Orchestrator for member management UI
 * @module modules/groups/components/group-settings
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { api } from '@/lib/api';
import type { MembersTabProps } from './types';
import {
  MemberSearchBar,
  MemberListItem,
  ConfirmActionModal,
  RoleAssignmentModal,
} from './members-tab/index';
import type { GroupMember, GroupRole, MemberAction } from './members-tab/index';

/**
 * unknown for the groups module.
 */
/**
 * Members Tab component.
 */
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
      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setMembers(
        data.map((m: Record<string, unknown>) => {
          // safe downcast – runtime-verified object for nested user property
          const mUser =
            typeof m.user === 'object' && m.user !== null
               
              ? (m.user as Record<string, unknown>) // safe downcast – runtime verified
              : {};
          return {
            id: String(m.id ?? ''),
            userId: String(m.user_id ?? m.userId ?? m.id ?? ''),
            username: String(m.username ?? mUser.username ?? 'unknown'),
             
            displayName: (m.display_name ?? m.displayName ?? mUser.display_name ?? null) as
              | string
              | null, // safe downcast – API response field
             
            avatarUrl: (m.avatar_url ?? m.avatarUrl ?? mUser.avatar_url ?? null) as string | null, // safe downcast – API response field
            role: String(m.role ?? 'member'),
            roles: Array.isArray(m.roles)
               
              ? (m.roles as Array<{ id: string; name: string; color: string }>) // safe downcast – runtime verified
              : [], // safe downcast – array verified by Array.isArray
            joinedAt: String(m.joined_at ?? m.joinedAt ?? m.inserted_at ?? ''),
            isMuted: !!(m.is_muted ?? m.isMuted),
             
            mutedUntil: (m.muted_until ?? m.mutedUntil ?? null) as string | null, // safe downcast – API response field
          };
        })
      );
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [groupId, roleFilter]);

  useEffect(() => {
    fetchMembers();
    api
      .get(`/api/v1/groups/${groupId}/roles`)
      .then((res) => {
        const roles = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setAvailableRoles(
          roles.map((r: Record<string, unknown>) => ({
            id: String(r.id ?? ''),
            name: String(r.name ?? ''),
            color: String(r.color ?? '#808080'),
            position: Number(r.position ?? 0),
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
      /* Handle error */
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
      /* Handle error */
    }
    setConfirmAction({ memberId: '', action: 'none' });
    setBanDuration('permanent');
  };

  const handleMute = async (memberId: string) => {
    try {
      await api.post(`/api/v1/groups/${groupId}/members/${memberId}/mute`);
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, isMuted: true } : m)));
    } catch {
      /* Handle error */
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
      /* Handle error */
    }
  };

  const handleConfirmAction = (memberId: string, action: MemberAction) => {
    if (action === 'kick') handleKick(memberId);
    else if (action === 'ban') handleBan(memberId);
    else if (action === 'mute') handleMute(memberId);
  };

  const handleOpenRoleModal = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    setSelectedRoleIds(new Set(member?.roles.map((r) => r.id) ?? []));
    setRoleModalMemberId(memberId);
  };

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSaveRoles = async () => {
    if (!roleModalMemberId) return;
    try {
      await api.put(`/api/v1/groups/${groupId}/members/${roleModalMemberId}/roles`, {
        role_ids: Array.from(selectedRoleIds),
      });
      fetchMembers();
    } catch {
      /* Handle error */
    }
    setRoleModalMemberId(null);
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.username.toLowerCase().includes(q) || (m.displayName?.toLowerCase().includes(q) ?? false)
    );
  });

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
          Manage group members, roles, and moderation. {members.length} member
          {members.length !== 1 ? 's' : ''}
        </p>
      </div>

      <MemberSearchBar
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

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
              <MemberListItem
                key={member.id}
                member={member}
                index={index}
                isMenuOpen={openMenuId === member.id}
                onToggleMenu={setOpenMenuId}
                onAction={(id, action) => setConfirmAction({ memberId: id, action })}
                onOpenRoleModal={handleOpenRoleModal}
                onUnmute={handleUnmute}
              />
            ))}
          </AnimatePresence>
        )}
      </GlassCard>

      <ConfirmActionModal
        action={confirmAction.action}
        memberId={confirmAction.memberId}
        banDuration={banDuration}
        onBanDurationChange={setBanDuration}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmAction({ memberId: '', action: 'none' })}
      />

      <RoleAssignmentModal
        memberId={roleModalMemberId}
        members={members}
        availableRoles={availableRoles}
        selectedRoleIds={selectedRoleIds}
        onToggleRole={handleToggleRole}
        onSave={handleSaveRoles}
        onClose={() => setRoleModalMemberId(null)}
      />
    </motion.div>
  );
}
