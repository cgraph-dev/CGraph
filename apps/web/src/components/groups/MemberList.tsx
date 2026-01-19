import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ChatBubbleLeftIcon,
  UserMinusIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
void EllipsisVerticalIcon; // Reserved for member context menu
import { StarIcon as CrownIcon } from '@heroicons/react/24/solid';
import { useGroupStore, type Member, type Role } from '@/stores/groupStore';
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
void THEME_COLORS; // Reserved for role color theming
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

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

interface MemberListProps {
  groupId: string;
  className?: string;
}

type StatusType = 'online' | 'idle' | 'dnd' | 'offline';

const statusColors: Record<StatusType, string> = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-gray-500',
};

const statusLabels: Record<StatusType, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  offline: 'Offline',
};

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
      <div className="border-b border-gray-700/50 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-dark-800 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
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

// Role Section Component
function RoleSection({
  role,
  members,
  onMemberClick,
}: {
  role: Role;
  members: Member[];
  onMemberClick: (member: Member, event: React.MouseEvent) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wider">
        <span style={{ color: role.color }}>{role.name}</span>
        <span className="text-gray-500">— {members.length}</span>
      </div>
      {members.map((member) => (
        <MemberItem
          key={member.id}
          member={member}
          roleColor={role.color}
          onClick={(e) => onMemberClick(member, e)}
        />
      ))}
    </div>
  );
}

// Member Item Component
function MemberItem({
  member,
  roleColor,
  onClick,
}: {
  member: Member;
  roleColor?: string;
  onClick: (event: React.MouseEvent) => void;
}) {
  const status = (member.user.status as StatusType) || 'offline';
  const displayName = member.nickname || member.user.displayName || member.user.username;

  return (
    <motion.div
      whileHover={{ x: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5"
    >
      {/* Avatar with status */}
      <div className="relative">
        <ThemedAvatar src={member.user.avatarUrl} alt={displayName} size="small" />
        <div
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-dark-900 ${statusColors[status]}`}
          title={statusLabels[status]}
        />
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: roleColor || '#fff' }}>
          {displayName}
        </p>
        {member.nickname && member.nickname !== member.user.username && (
          <p className="truncate text-xs text-gray-500">@{member.user.username}</p>
        )}
      </div>

      {/* Role badges */}
      {member.roles?.slice(0, 2).map((role) => (
        <div key={role.id} className="hidden group-hover:block" title={role.name}>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
        </div>
      ))}
    </motion.div>
  );
}

// Member Context Menu
function MemberContextMenu({
  member,
  position,
  isOwner,
  onClose,
}: {
  member: Member;
  position: { x: number; y: number };
  isOwner: boolean;
  onClose: () => void;
}) {
  const displayName = member.nickname || member.user.displayName || member.user.username;

  const menuItems = [
    {
      icon: ChatBubbleLeftIcon,
      label: 'Message',
      action: () => {
        console.log('Opening DM with', member.userId);
        onClose();
      },
    },
    {
      icon: UserPlusIcon,
      label: 'View Profile',
      action: () => {
        console.log('Viewing profile of', member.userId);
        onClose();
      },
    },
    { divider: true },
    {
      icon: ShieldCheckIcon,
      label: 'Manage Roles',
      action: () => {
        console.log('Managing roles for', member.userId);
        onClose();
      },
      adminOnly: true,
    },
    {
      icon: UserMinusIcon,
      label: 'Kick',
      action: () => {
        console.log('Kicking', member.userId);
        onClose();
      },
      adminOnly: true,
      danger: true,
    },
    {
      icon: NoSymbolIcon,
      label: 'Ban',
      action: () => {
        console.log('Banning', member.userId);
        onClose();
      },
      adminOnly: true,
      danger: true,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed z-50 min-w-[200px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 220),
          top: Math.min(position.y, window.innerHeight - 300),
        }}
      >
        <GlassCard variant="frosted" className="overflow-hidden py-2">
          {/* Header */}
          <div className="border-b border-gray-700/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <ThemedAvatar src={member.user.avatarUrl} alt={displayName} size="medium" />
              <div>
                <p className="font-semibold text-white">{displayName}</p>
                <p className="text-xs text-gray-400">@{member.user.username}</p>
              </div>
              {isOwner && <CrownIcon className="h-5 w-5 text-yellow-400" title="Server Owner" />}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              if ('divider' in item) {
                return (
                  <div key={`divider-${index}`} className="my-1 border-t border-gray-700/50" />
                );
              }

              return (
                <motion.button
                  key={item.label}
                  whileHover={{ x: 2 }}
                  onClick={item.action}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    item.danger
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>
    </>
  );
}

export default MemberList;
