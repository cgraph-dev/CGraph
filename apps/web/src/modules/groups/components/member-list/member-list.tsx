/**
 * MemberList Component - Group member list with role sections and search
 * @module modules/groups/components/member-list
 */
import { useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { MagnifyingGlassIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
void EllipsisVerticalIcon; // Reserved for member context menu
import { useGroupStore, type Member } from '@/modules/groups/store';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
void THEME_COLORS; // Reserved for role color theming
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { RoleSection, MemberItem, MemberContextMenu } from './member-item';
import type { MemberListProps } from './types';

/**
 * MemberList Component
 *
 * Displays group members organized by role with rich interactions.
 * Features:
 * - Role-based grouping with colors
 * - Online/offline status
 * - Member search
 * - Context menu (kick, ban, DM, manage roles)
 * - Owner/admin badges
 * - Themed avatars
 */

/**
 * unknown for the groups module.
 */
/**
 * Member List component.
 */
export function MemberList({ groupId, className = '' }: MemberListProps) {
  const { groups, members: membersByGroup, fetchMembers } = useGroupStore();
  const { theme } = useThemeStore();
  void theme; // Reserved for member card theming

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  const activeGroup = groups.find((g) => g.id === groupId);
  const members = membersByGroup[groupId] || [];

  // Fetch members on mount
  useMemo(() => {
    if (groupId && members.length === 0) {
      fetchMembers(groupId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // Filter members by search
  const filteredMembers = members.filter((member) =>
    (member.nickname || member.user.displayName || member.user.username)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Group members by role
  const membersByRole = useMemo(() => {
    const grouped = new Map<string, Member[]>();
    const noRoleMembers: Member[] = [];

    // Get roles sorted by position
    const sortedRoles = [...(activeGroup?.roles || [])].sort((a, b) => b.position - a.position);

    filteredMembers.forEach((member) => {
      const highestRole = member.roles?.sort((a, b) => b.position - a.position)[0];

      if (highestRole) {
        const existing = grouped.get(highestRole.id) || [];
        existing.push(member);
        grouped.set(highestRole.id, existing);
      } else {
        noRoleMembers.push(member);
      }
    });

    return { grouped, sortedRoles, noRoleMembers };
  }, [filteredMembers, activeGroup?.roles]);

  // Separate online/offline
  const onlineMembers = filteredMembers.filter((m) => m.user.status !== 'offline');
  void onlineMembers; // Reserved for online members section header count
  const offlineMembers = filteredMembers.filter((m) => m.user.status === 'offline');

  const handleMemberClick = (member: Member, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedMember(member);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    HapticFeedback.light();
  };

  const closeContextMenu = () => {
    setSelectedMember(null);
    setContextMenuPosition(null);
  };

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="border-b border-white/[0.06] p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Online Members by Role */}
        {membersByRole.sortedRoles.map((role) => {
          const roleMembers = (membersByRole.grouped.get(role.id) || []).filter(
            (m) => m.user.status !== 'offline'
          );

          if (roleMembers.length === 0) return null;

          return (
            <RoleSection
              key={role.id}
              role={role}
              members={roleMembers}
              onMemberClick={handleMemberClick}
            />
          );
        })}

        {/* Online members without role */}
        {membersByRole.noRoleMembers.filter((m) => m.user.status !== 'offline').length > 0 && (
          <RoleSection
            role={{
              id: 'online',
              name: 'Online',
              color: '#10b981',
              position: -1,
              permissions: 0,
              isDefault: false,
              isMentionable: false,
            }}
            members={membersByRole.noRoleMembers.filter((m) => m.user.status !== 'offline')}
            onMemberClick={handleMemberClick}
          />
        )}

        {/* Offline Members */}
        {offlineMembers.length > 0 && (
          <div className="mt-4">
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Offline — {offlineMembers.length}
            </div>
            {offlineMembers.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                onClick={(e) => handleMemberClick(member, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {selectedMember && contextMenuPosition && (
          <MemberContextMenu
            member={selectedMember}
            position={contextMenuPosition}
            isOwner={activeGroup?.ownerId === selectedMember.userId}
            onClose={closeContextMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default MemberList;
