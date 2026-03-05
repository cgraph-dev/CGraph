/**
 * MemberList — Discord-style member list panel for groups/channels.
 * @module modules/chat/components/chat-info-panel/member-list
 */
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, Tooltip, ScrollArea } from '@/components/ui';

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  role?: string;
  roleBadgeColor?: string;
  bio?: string;
  joinedAt?: string;
}

interface MemberListProps {
  members: Member[];
  onMemberClick?: (memberId: string) => void;
  onMemberContextMenu?: (memberId: string, e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Discord-style member list grouped by online/offline with role badges.
 */
export function MemberList({
  members,
  onMemberClick,
  onMemberContextMenu,
  className,
}: MemberListProps) {
  const [search, setSearch] = useState('');

  const { online, offline } = useMemo(() => {
    const filtered = search
      ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
      : members;

    return {
      online: filtered.filter((m) => m.status !== 'offline'),
      offline: filtered.filter((m) => m.status === 'offline'),
    };
  }, [members, search]);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Search */}
      <div className="px-3 py-2">
        <input
          type="text"
          placeholder="Search members"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            'w-full rounded-md px-2.5 py-1.5 text-xs',
            'bg-white/[0.04] text-white/80 placeholder-white/30',
            'border border-white/[0.06] outline-none',
            'focus:border-[var(--color-brand-purple)]/40',
          )}
        />
      </div>

      <ScrollArea className="flex-1">
        {/* Online section */}
        <MemberSection
          label={`Online — ${online.length}`}
          members={online}
          onMemberClick={onMemberClick}
          onMemberContextMenu={onMemberContextMenu}
        />

        {/* Offline section */}
        {offline.length > 0 && (
          <MemberSection
            label={`Offline — ${offline.length}`}
            members={offline}
            onMemberClick={onMemberClick}
            onMemberContextMenu={onMemberContextMenu}
            defaultCollapsed
          />
        )}
      </ScrollArea>
    </div>
  );
}

interface MemberSectionProps {
  label: string;
  members: Member[];
  onMemberClick?: (memberId: string) => void;
  onMemberContextMenu?: (memberId: string, e: React.MouseEvent) => void;
  defaultCollapsed?: boolean;
}

function MemberSection({
  label,
  members,
  onMemberClick,
  onMemberContextMenu,
  defaultCollapsed = false,
}: MemberSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="px-2 py-1">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="mb-1 flex w-full items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-white/30 hover:text-white/50"
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className={cn('transition-transform', !collapsed && 'rotate-90')}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {label}
      </button>

      {!collapsed &&
        members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onMemberClick?.(member.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              onMemberContextMenu?.(member.id, e);
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5',
              'transition-colors hover:bg-white/[0.04]',
              member.status === 'offline' && 'opacity-40',
            )}
          >
            <Avatar
              size="sm"
              name={member.name}
              src={member.avatarUrl}
              status={member.status}
            />
            <div className="min-w-0 flex-1 text-left">
              <span className="block truncate text-xs text-white/80">
                {member.name}
              </span>
            </div>
            {member.role && (
              <Tooltip content={member.role} side="left">
                <span
                  className="flex-shrink-0 rounded px-1 py-0.5 text-[9px] font-medium"
                  style={{
                    backgroundColor: (member.roleBadgeColor ?? '#5865F2') + '20',
                    color: member.roleBadgeColor ?? '#5865F2',
                  }}
                >
                  {member.role}
                </span>
              </Tooltip>
            )}
          </button>
        ))}
    </div>
  );
}

export default MemberList;
