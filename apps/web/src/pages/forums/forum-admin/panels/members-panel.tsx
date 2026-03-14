/**
 * Forum admin members management panel.
 * @module
 */
import { motion } from 'motion/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { MemberData } from '../types';
import { MEMBER_ROLES } from '../constants';

interface MembersPanelProps {
  members: MemberData[];
  memberSearch: string;
  memberFilter: string;
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: string) => void;
  onUpdateMemberRole: (memberId: string, role: string) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Members Panel component.
 */
export function MembersPanel({
  members,
  memberSearch,
  memberFilter,
  onSearchChange,
  onFilterChange,
  onUpdateMemberRole,
}: MembersPanelProps) {
  const filteredMembers = members.filter(
    (m) =>
      (memberFilter === 'all' || m.role === memberFilter) &&
      (m.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.displayName.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  return (
    <motion.div
      key="members"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Members</h2>
        <p className="text-gray-400">Manage forum members and their roles.</p>
      </div>

      <GlassCard className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search members..."
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] py-2.5 pl-10 pr-4 text-white"
            />
          </div>
          <select
            value={memberFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-white"
          >
            <option value="all">All Roles</option>
            {MEMBER_ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <motion.div
              key={member.id}
              className="flex items-center gap-3 rounded-lg bg-white/[0.06] p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-500">
                <span className="font-bold text-white">{member.displayName[0]}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{member.displayName}</span>
                  <span
                    className={`text-xs ${MEMBER_ROLES.find((r) => r.id === member.role)?.color}`}
                  >
                    @{member.username}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{member.postCount} posts</span>
                  <span>{member.pulse} pulse</span>
                  <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <select
                value={member.role}
                onChange={(e) => onUpdateMemberRole(member.id, e.target.value)}
                className={`rounded-lg border border-dark-500 bg-white/[0.08] px-3 py-1.5 text-sm ${
                  MEMBER_ROLES.find((r) => r.id === member.role)?.color
                }`}
              >
                {MEMBER_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
